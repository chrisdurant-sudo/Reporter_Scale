import { describe, expect, it } from "vitest";
import type { AvailabilityWindow, CredentialRecord, DemoSnapshotV2, MarketId, NetworkCommandEnvelope, ReporterId, UtcTimestamp, WorkItem, WorkspaceFilterPayload, WorkspaceQueryContext } from "../../contracts/v2";
import { createDemoRepositoryV2, DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { commitV2Command } from "../../integration/v2CommandTransaction";
import { validateEvidenceBundle } from "../shared/evidence";
import { acceptedCommitmentIssues, firstCompletedJobs, prepareNetworkCommand, prepareNetworkView, prepareReengagementFollowUp } from "./index";

const at = (value: string) => value as UtcTimestamp;
const id = (value: string) => value as never;
const asOf = at("2026-02-16T17:00:00Z");
const old = at("2025-01-01T00:00:00Z");
const emptyFilters: WorkspaceFilterPayload = { selectedMarket: "ALL", marketBasis: "all-markets", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: null };
function context(state: DemoSnapshotV2, filters: Partial<WorkspaceFilterPayload> = {}, asOfAt = asOf): WorkspaceQueryContext<"reporters"> {
  return { workspace: "reporters", evaluation: { asOfAt, snapshotRevision: state.revision, reportingTimeZone: "America/Los_Angeles" as never }, filters: { ...emptyFilters, ...filters } };
}
function base(): DemoSnapshotV2 {
  const seed = DEMO_SNAPSHOT_V2;
  return { ...seed, currentAsOfAt: asOf, reporters: ["available", "unavailable", "expired", "unknown", "closed"].map((name) => ({ ...seed.reporters[0]!, id: id(name), fictionalName: name, createdAt: old, recordedAt: old, serviceMarketIds: ["LAX", "SFO"], preferences: { attendanceModes: ["remote", "in-person"], supportedProceedingTypes: [id("deposition")], supportedCapabilityCodes: [id("realtime-transcription")], serviceMarkets: [{ marketId: "LAX", status: "serves" }, { marketId: "SFO", status: "needs-confirmation" }], notes: "Prefers morning proceedings" } })),
    readinessEvents: ["available", "unavailable", "expired", "unknown", "closed"].map((name) => ({ ...seed.readinessEvents[0]!, id: id(`ready-${name}`), reporterId: id(name), occurredAt: old, recordedAt: old })),
    lifecycleEvents: [{ ...seed.lifecycleEvents[0]!, reporterId: id("closed"), eventType: "closed", occurredAt: old, recordedAt: old }],
    capabilityVerifications: [], credentialRecords: [], availabilityWindows: [], acquisitionCases: [], programEnrollments: [], screeningReviews: [], onboardingSteps: [], demandRequests: [], assignmentEvents: [], jobOutcomes: [], workItems: [] };
}
function withJob(state: DemoSnapshotV2, key: string, reporterId: string, completedAt: UtcTimestamp, marketId: MarketId = "LAX"): DemoSnapshotV2 {
  const start = at(new Date(Date.parse(completedAt) - 3_600_000).toISOString());
  const acceptedAt = at(new Date(Date.parse(start) - 3_600_000).toISOString());
  const request = { ...DEMO_SNAPSHOT_V2.demandRequests[0]!, id: id(`request-${key}`), marketId, createdAt: old, recordedAt: old, startAt: start, endAt: completedAt, attendanceMode: "remote" as const };
  const assignment = { ...DEMO_SNAPSHOT_V2.assignmentEvents[0]!, id: id(`assignment-${key}`), reporterId: id(reporterId), requestId: request.id, state: "accepted" as const, occurredAt: acceptedAt, recordedAt: acceptedAt };
  const job = { ...DEMO_SNAPSHOT_V2.jobOutcomes[0]!, id: id(`job-${key}`), reporterId: id(reporterId), requestId: request.id, acceptedAssignmentEventId: assignment.id, outcome: "completed" as const, completedAt, startedAt: start, recordedAt: completedAt };
  return { ...state, demandRequests: [...state.demandRequests, request], assignmentEvents: [...state.assignmentEvents, assignment], jobOutcomes: [...state.jobOutcomes, job] };
}
function availability(reporterId: string, overrides: Partial<AvailabilityWindow> = {}): AvailabilityWindow {
  return { ...DEMO_SNAPSHOT_V2.availabilityWindows[0]!, id: id(`availability-${reporterId}`), reporterId: id(reporterId), startAt: at("2026-02-01T00:00:00Z"), endAt: at("2026-03-01T00:00:00Z"), recordedAt: at("2026-02-01T00:00:00Z"), confirmationExpiresAt: null, status: "available", serviceMarketIds: ["LAX", "SFO"], attendanceModes: ["remote", "in-person"], ...overrides };
}
function credential(overrides: Partial<CredentialRecord> = {}): CredentialRecord {
  return { ...DEMO_SNAPSHOT_V2.credentialRecords[0]!, id: id("credential"), reporterId: id("available"), label: "CA", jurisdictionScope: "CA", verificationStatus: "verified", validFrom: old, validUntil: at("2027-01-01T00:00:00Z"), recordedAt: old, ...overrides };
}
function work(overrides: Partial<WorkItem> = {}): WorkItem {
  return { ...DEMO_SNAPSHOT_V2.workItems[0]!, id: id("follow-up"), kind: "re-engage", primaryEntityRef: { kind: "reporter", id: "available" }, createdAt: old, statusHistory: [{ status: "open", occurredAt: old, actorId: id("actor-team-1"), reason: "Follow up" }], ...overrides };
}
const row = (state: DemoSnapshotV2, filters: Partial<WorkspaceFilterPayload> = {}) => prepareNetworkView(state, context(state, filters)).reporters.find((item) => item.reporterId === "available")!;

describe("Network source projections — IC04/IP07", () => {
  it("keeps unknown, expired, unavailable and available separate from credentials (D04)", () => {
    const state = { ...base(), availabilityWindows: [availability("available"), availability("unavailable", { status: "unavailable" }), availability("expired", { confirmationExpiresAt: asOf })] };
    const view = prepareNetworkView(state, context(state));
    expect(Object.fromEntries(view.reporters.map((item) => [item.name, item.availability]))).toEqual({ available: "available", unavailable: "unavailable", expired: "expired", unknown: "unknown" });
    expect(view.needsConfirmationReporterIds).toEqual(["expired", "unknown"]);
    expect(view.reporters.every((item) => item.compliance.state === "needs-check")).toBe(true);
  });
  it("returns actual verified skill codes/evidence and structured preferences without availability", () => {
    const source = { ...DEMO_SNAPSHOT_V2.capabilityVerifications[0]!, id: id("skill-z"), reporterId: id("available"), capabilityCode: id("realtime-transcription"), status: "verified" as const, recordedAt: old };
    const state = { ...base(), capabilityVerifications: [source] };
    expect(row(state).verifiedSkills).toEqual([{ code: "realtime-transcription", label: "realtime transcription", record: source, sourceRef: { kind: "capability-verification", id: "skill-z" }, evidenceRef: source.evidenceRef }]);
    expect(row(state).preferences).toEqual(state.reporters[0]!.preferences);
    expect(row(state).preferences).not.toHaveProperty("availability");
    expect(row(state).availability).toBe("unknown");
    const revoked = { ...state, capabilityVerifications: [...state.capabilityVerifications, { ...source, id: id("skill-a"), status: "needs-information" as const }] };
    expect(row(revoked).verifiedSkills).toEqual([]);
    expect(row(revoked).capabilitySummary).toBe("0 verified; 1 unknown; 0 not demonstrated");
  });
  it("uses append order for same-time credentials and readiness and excludes future records", () => {
    const state = { ...base(), credentialRecords: [credential({ id: id("z") }), credential({ id: id("a"), verificationStatus: "needs-information" }), credential({ id: id("future"), recordedAt: at("2026-02-17T00:00:00Z") })] };
    expect(row(state).credentialRecords.map((item) => item.id)).toEqual(["a"]);
    expect(row(state).compliance.state).toBe("needs-check");
    const newReadiness = { ...state.readinessEvents[0]!, id: id("latest-readiness") };
    expect(row({ ...state, readinessEvents: [...state.readinessEvents, newReadiness] }).readinessRef.id).toBe("latest-readiness");
    const future = { ...state, reporters: state.reporters.map((item) => item.id === "available" ? { ...item, recordedAt: at("2026-02-17T00:00:00Z") } : item) };
    expect(row(future)).toBeUndefined();
  });
  it("separates national credential labels and current/expiring/review evidence", () => {
    const state = { ...base(), credentialRecords: [credential(), credential({ id: id("rpr"), jurisdictionScope: null, label: "RPR", validUntil: at("2026-03-16T17:00:00Z") })] };
    expect(row(state).certificationSummary).toBe("CA · RPR");
    expect(row(state).compliance).toEqual({ state: "expiring", evidenceLabel: "Verified credential expires within 28 days" });
    expect(row({ ...state, credentialRecords: [credential()] }).compliance.state).toBe("clear");
    expect(row({ ...state, credentialRecords: [credential({ validUntil: asOf })] }).compliance.state).toBe("needs-check");
  });
  it("does not generalize another market/mode's availability or preferences to all scope", () => {
    const state = { ...base(), availabilityWindows: [availability("available", { serviceMarketIds: ["SFO"], attendanceModes: ["remote"] })] };
    expect(row(state, { selectedMarket: "LAX", attendanceModes: ["remote"] }).availability).toBe("unknown");
    expect(row(state, { selectedMarket: "SFO", attendanceModes: ["remote"] }).availability).toBe("available");
    expect(row(state, { selectedMarket: "SFO", attendanceModes: ["in-person"] }).availability).toBe("unknown");
    expect(row(state).availability).toBe("unknown");
    expect(row(state).availabilityIsMixed).toBe(true);
    expect(row(state).availabilityCells).toHaveLength(4);
    const expired = { ...state, availabilityWindows: [availability("available", { serviceMarketIds: ["SFO"], attendanceModes: ["remote"], confirmationExpiresAt: asOf })] };
    expect(row(expired).availability).toBe("expired");
    expect(row(expired).availabilityIsMixed).toBe(true);
    expect(row(expired).availabilityCells.map((cell) => cell.state)).toEqual(["unknown", "unknown", "expired", "unknown"]);
    expect(row(expired).availabilityLimitations.join(" ")).toContain("some scope has expired evidence and other scope may be missing");
    expect(prepareNetworkView(expired, context(expired)).needsConfirmationReporterIds).toContain("available");
    expect(row(state).availabilityWindows[0]).toMatchObject({ startAt: "2026-02-01T00:00:00Z", endAt: "2026-03-01T00:00:00Z", serviceMarketIds: ["SFO"], attendanceModes: ["remote"] });
  });
  it("uses newer same-time availability appends and half-open bounded intervals", () => {
    const current = availability("available", { id: id("z") });
    const state = { ...base(), availabilityWindows: [current, { ...current, id: id("a"), status: "unavailable" as const }] };
    expect(row(state).availability).toBe("unavailable");
    expect(row({ ...state, availabilityWindows: [{ ...current, endAt: asOf }] }).availability).toBe("unknown");
  });
});

describe("Network exact scopes and activity — IP01/IP06/M05/M10", () => {
  it("uses half-open trailing windows, distinct people and actual job markets", () => {
    let state = withJob(base(), "start", "available", at("2026-01-19T17:00:00Z"));
    state = withJob(state, "inside", "available", at("2026-02-15T17:00:00Z"), "SFO");
    state = withJob(state, "end", "unknown", asOf);
    const all = prepareNetworkView(state, context(state));
    expect(all.evidence[0]!.computation).toMatchObject({ value: 1 });
    expect(all.trend[0]!.activeReporterIds).toEqual(["available"]);
    expect(row(state).recentJobCount).toBe(2);
    expect(row(state, { selectedMarket: "LAX" }).recentJobCount).toBe(1);
    expect(row(state, { selectedMarket: "SFO" }).recentJobCount).toBe(1);
    expect(all.evidence[0]!.limitations).toContain("No recent work is not attrition or unwillingness.");
    expect(validateEvidenceBundle(all.evidence[0]!)).toEqual([]);
    expect(all.evidence[0]!.contributingRecords[0]!.joinPath).toEqual([{ kind: "demand-request", id: "request-inside" }, { kind: "reporter", id: "available" }]);
  });
  it("honors matchNone and contradictory exact reporter/record/request/job/market selections", () => {
    let state = withJob(base(), "a", "available", at("2026-02-15T17:00:00Z"));
    state = withJob(state, "u", "unknown", at("2026-02-15T17:00:00Z"));
    for (const filters of [
      { matchNone: true }, { reporterIds: [id("missing")] },
      { reporterIds: [id("available")], recordRefs: [{ kind: "reporter" as const, id: "unknown" }] },
      { requestIds: [id("request-a")], jobOutcomeIds: [id("job-u")] },
      { requestIds: [id("request-a")], recordRefs: [{ kind: "job-outcome" as const, id: "job-u" }] },
      { selectedMarket: "LAX" as const, marketIds: ["SFO" as const] },
    ]) {
      const view = prepareNetworkView(state, context(state, filters));
      expect(view.reporters, JSON.stringify(filters)).toEqual([]);
      expect(view.evidence[0]!.filters.matchNone).toBe(true);
      expect(view.trend[0]!.activeReporterIds).toEqual([]);
      expect(view.trend[0]!.priorActiveReporterIds).toEqual([]);
      expect(view.attention).toEqual([]);
    }
    expect(prepareNetworkView(state, context(state, { reporterIds: [id("available")], requestIds: [id("request-a")], jobOutcomeIds: [id("job-a")], recordRefs: [{ kind: "job-outcome", id: "job-a" }] })).reporters.map((item) => item.reporterId)).toEqual(["available"]);
  });
  it("conjoins case/source/program/enrollment/work filters and ignores unsupported references by matching none", () => {
    const state: DemoSnapshotV2 = { ...base(), acquisitionCases: [{ ...DEMO_SNAPSHOT_V2.acquisitionCases[0]!, id: id("case-a"), reporterId: id("available"), primarySourceId: id("source-a"), openedAt: old, recordedAt: old, originProgramId: null }], programEnrollments: [{ ...DEMO_SNAPSHOT_V2.programEnrollments[0]!, id: id("enroll-a"), acquisitionCaseId: id("case-a"), programId: id("program-a"), enteredAt: old }], workItems: [work()] };
    const filters = { acquisitionCaseIds: [id("case-a")], sourceIds: [id("source-a")], programIds: [id("program-a")], programEnrollmentIds: [id("enroll-a")], workItemIds: [id("follow-up")] };
    expect(prepareNetworkView(state, context(state, filters)).reporters.map((item) => item.reporterId)).toEqual(["available"]);
    for (const changed of [{ sourceIds: [id("source-b")] }, { programIds: [id("program-b")] }, { workItemIds: [id("missing")] }, { recordRefs: [{ kind: "command-record" as const, id: "unrelated" }] }]) expect(prepareNetworkView(state, context(state, { ...filters, ...changed })).reporters).toEqual([]);
  });
  it("reopens exact evidence/detail without inheriting conflicting capability, source or empty filters", () => {
    const cap = { ...DEMO_SNAPSHOT_V2.capabilityVerifications[0]!, reporterId: id("available"), recordedAt: old, status: "verified" as const };
    const state = { ...withJob(base(), "a", "available", at("2026-02-15T17:00:00Z")), capabilityVerifications: [cap] };
    const view = prepareNetworkView(state, context(state, { selectedMarket: "LAX", capabilityCodes: [cap.capabilityCode] }));
    const evidence = view.evidence[0]!;
    expect(evidence.navigationTarget.filters.capabilityCodes).toEqual([]);
    expect(evidence.navigationTarget.evidenceContext).toMatchObject({ asOfAt: asOf, snapshotRevision: state.revision });
    expect(prepareNetworkView(state, context(state, evidence.navigationTarget.filters)).reporters.map((item) => item.reporterId)).toEqual(["available"]);
    expect(prepareNetworkView(state, context(state, view.reporters[0]!.detailTarget.filters)).reporters.map((item) => item.reporterId)).toEqual(["available"]);
    expect(row(state, { marketIds: ["LAX"] }).detailTarget.filters).toMatchObject({ selectedMarket: "LAX", marketIds: ["LAX"] });
    const empty = prepareNetworkView(state, context(state, { matchNone: true })).evidence[0]!;
    expect(prepareNetworkView(state, context(state, empty.navigationTarget.filters)).reporters).toEqual([]);
  });
  it("keeps a genuine global first job despite later market filtering and excludes accepted-only/invalid results", () => {
    let state = withJob(base(), "first", "available", at("2025-11-15T17:00:00Z"), "SFO");
    state = withJob(state, "later", "available", at("2026-02-15T17:00:00Z"));
    expect(row(state, { selectedMarket: "LAX", jobOutcomeIds: [id("job-later")] }).firstCompletedJob?.id).toBe("job-first");
    expect(firstCompletedJobs(state, asOf).map((job) => job.id)).toEqual(["job-first"]);
    expect(firstCompletedJobs({ ...state, jobOutcomes: [] }, asOf)).toEqual([]);
    for (const patch of [{ acceptedAssignmentEventId: id("missing") }, { completedAt: old }, { reporterId: id("unknown") }, { outcome: "not-completed" as const }]) expect(firstCompletedJobs({ ...state, jobOutcomes: [{ ...state.jobOutcomes[0]!, ...patch }] }, asOf)).toEqual([]);
  });
  it("keeps historical completions after later cancellation, but rejects declined-at-completion and same-time canceled acceptance", () => {
    const state = withJob(base(), "a", "available", at("2026-02-15T17:00:00Z"));
    const assignment = state.assignmentEvents[0]!;
    expect(firstCompletedJobs({ ...state, assignmentEvents: [...state.assignmentEvents, { ...assignment, id: id("cancel-later"), state: "canceled", occurredAt: asOf, recordedAt: asOf }] }, asOf)).toHaveLength(1);
    expect(firstCompletedJobs({ ...state, assignmentEvents: [...state.assignmentEvents, { ...assignment, id: id("a"), state: "canceled" }] }, asOf)).toEqual([]);
    const lateRecorded = { ...state, assignmentEvents: [{ ...assignment, recordedAt: asOf }] };
    expect(firstCompletedJobs(lateRecorded, asOf)).toHaveLength(1);
    expect(firstCompletedJobs(lateRecorded, at("2026-02-16T16:00:00Z"))).toEqual([]);
  });
  it("applies the same scoped population to current/prior sets and uses earlier global history for returning", () => {
    let state = withJob(base(), "old-sfo", "available", at("2025-11-15T17:00:00Z"), "SFO");
    state = withJob(state, "new-lax", "available", at("2026-02-15T17:00:00Z"));
    state = withJob(state, "prior-only", "unknown", at("2026-01-13T17:00:00Z"));
    const selected = prepareNetworkView(state, context(state, { selectedMarket: "LAX", reporterIds: [id("available")] })).trend[0]!;
    expect(selected.returningReporterIds).toEqual(["available"]);
    expect(selected.firstTimeEnteringReporterIds).toEqual([]);
    expect(selected.noRecentWorkReporterIds).toEqual([]);
    const all = prepareNetworkView(state, context(state, { selectedMarket: "LAX" })).trend[0]!;
    expect(all.noRecentWorkReporterIds).toEqual(["unknown"]);
    expect(all.priorWindow).toEqual({ startAt: "2026-01-12T17:00:00.000Z", endAt: "2026-02-09T17:00:00.000Z", boundary: "[start,end)" });
    expect(all.activeReporterIds).toEqual(["available"]);
  });
  it("flags conflicting accepted reporters and overlapping commitments, but not adjacent work", () => {
    let state = withJob(base(), "a", "available", at("2026-02-15T17:00:00Z"));
    state = withJob(state, "b", "available", at("2026-02-15T17:00:00Z"), "SFO");
    expect(acceptedCommitmentIssues(state, asOf)).toHaveLength(1);
    const second = { ...state.assignmentEvents[0]!, id: id("other"), reporterId: id("unknown") };
    const duplicate = { ...state, assignmentEvents: [state.assignmentEvents[0]!, second] };
    expect(acceptedCommitmentIssues(duplicate, asOf)[0]).toContain("two accepted");
    expect(firstCompletedJobs(duplicate, asOf)).toEqual([]);
    const adjacent = { ...state, demandRequests: [state.demandRequests[0]!, { ...state.demandRequests[1]!, startAt: state.demandRequests[0]!.endAt, endAt: at("2026-02-15T18:00:00Z") }] };
    expect(acceptedCommitmentIssues(adjacent, asOf)).toEqual([]);
  });
});

describe("Canonical follow-up preparation — D06/W02/IP07", () => {
  const input = { reporterId: id("available") as ReporterId, marketId: "LAX" as const, asOfAt: asOf, ownerId: null, dueAt: null };
  it("creates only typed Team inputs and disregards unrelated and terminal work", () => {
    const terminal = work({ id: id("terminal"), statusHistory: [...work().statusHistory, { status: "completed", occurredAt: asOf, actorId: id("actor-team-1"), reason: "Done" }] });
    const state = { ...base(), workItems: [work({ kind: "first-opportunity" }), terminal, work({ id: id("other-person"), primaryEntityRef: { kind: "reporter", id: "unknown" } })] };
    const before = JSON.stringify(state);
    const result = prepareReengagementFollowUp(state, input);
    expect(result).toEqual({ kind: "create", payload: { title: "Re-engage available", ownerId: null, dueAt: null, status: "open", domain: "market", kind: "re-engage", programId: null, primaryEntityRef: { kind: "reporter", id: "available" }, relatedRequestIds: [] } });
    expect(JSON.stringify(state)).toBe(before);
  });
  it("resolves one exact existing task repeatedly without changing assignment or date", () => {
    const state = { ...base(), workItems: [work()] };
    const result = prepareReengagementFollowUp(state, input);
    expect(result).toEqual(prepareReengagementFollowUp(state, { ...input, ownerId: id("different-owner"), dueAt: at("2026-02-20T00:00:00Z") }));
    expect(result).toMatchObject({ kind: "existing", workItemId: "follow-up", navigationTarget: { workspace: "team", filters: { workItemIds: ["follow-up"], reporterIds: ["available"], selectedMarket: "LAX", recordRefs: [{ kind: "work-item", id: "follow-up" }] }, evidenceContext: { asOfAt: asOf, snapshotRevision: state.revision } } });
  });
  it.each(["open", "in-progress", "blocked"] as const)("matches canonical %s re-engagement only", (status) => {
    const current = work({ statusHistory: [{ ...work().statusHistory[0]!, status }] });
    expect(prepareReengagementFollowUp({ ...base(), workItems: [current] }, input).kind).toBe("existing");
  });
  it("respects same-time latest status and permits fresh work after cancellation", () => {
    const current = work({ statusHistory: [...work().statusHistory, { ...work().statusHistory[0]!, status: "canceled" }] });
    expect(prepareReengagementFollowUp({ ...base(), workItems: [current] }, input).kind).toBe("create");
    const createdByTeam = work({ id: id("new-canonical-work"), createdAt: asOf });
    const saved = { ...base(), workItems: [current, createdByTeam] };
    expect(prepareReengagementFollowUp(saved, input)).toMatchObject({ kind: "existing", workItemId: "new-canonical-work" });
  });
  it("requires explicit owner/date and offers only active canonical owner options", () => {
    expect(() => prepareReengagementFollowUp(base(), { ...input, ownerId: id("missing") })).toThrow("active owner");
    expect(() => prepareReengagementFollowUp(base(), { ...input, dueAt: at("invalid") })).toThrow("due date");
    const state = base();
    expect(prepareNetworkView(state, context(state)).followUpInputs.ownerOptions.map((item) => item.id)).toEqual(state.teamMembers.filter((member) => Date.parse(member.activeFrom) <= Date.parse(asOf) && (member.activeTo === null || Date.parse(member.activeTo) > Date.parse(asOf))).map((member) => member.id));
  });
  it("offers a concrete re-engagement action and exact target without inferring churn", () => {
    const state = withJob(base(), "historic", "available", at("2025-11-15T17:00:00Z"));
    expect(row(state).followUp).toBe("create-reengagement-task");
    expect(row({ ...state, workItems: [work({ kind: "first-opportunity" })] }).followUp).toBe("create-reengagement-task");
    expect(row({ ...state, workItems: [work()] })).toMatchObject({ followUp: "open-task", openReengagementWorkItemId: "follow-up" });
  });
});

function command(state = base()): NetworkCommandEnvelope {
  return { type: "network.record-availability", context: { commandId: id("explicit-availability"), expectedRevision: state.revision, actorId: state.teamMembers[0]!.actorId, occurredAt: state.currentAsOfAt }, payload: { reporterId: id("available"), startAt: at("2026-02-17T17:00:00Z"), endAt: at("2026-02-17T20:00:00Z"), status: "available", serviceMarketIds: ["SFO"], attendanceModes: ["in-person"], confirmationExpiresAt: at("2026-02-17T21:00:00Z") } };
}
describe("Explicit availability command — IC04/D04/W02", () => {
  it("appends exactly entered evidence and preserves all other domains and transaction metadata", () => {
    const state = base(), original = JSON.stringify(state), action = command(state);
    const mutation = prepareNetworkCommand(state, action);
    expect(mutation.snapshot.availabilityWindows.at(-1)).toEqual({ ...action.payload, id: "availability-explicit-availability", recordedAt: asOf, actorId: state.teamMembers[0]!.actorId, source: "demo-simulation", provenance: "demo-simulation" });
    for (const key of Object.keys(state) as (keyof DemoSnapshotV2)[]) if (key !== "availabilityWindows") expect(mutation.snapshot[key], key).toBe(state[key]);
    expect(JSON.stringify(state)).toBe(original);
    expect(() => prepareNetworkCommand(mutation.snapshot, action)).toThrow("identity already exists");
  });
  it.each([
    { reporterId: id("missing") }, { serviceMarketIds: [] }, { serviceMarketIds: ["ALL"] }, { serviceMarketIds: ["LAX", "missing"] }, { serviceMarketIds: ["LAX", "LAX"] },
    { attendanceModes: [] }, { attendanceModes: ["both"] }, { status: "confirmed" }, { startAt: "invalid" }, { endAt: "2026-02-17T17:00:00Z" }, { confirmationExpiresAt: asOf }, { confirmationExpiresAt: "invalid" },
  ])("rejects invalid or guessed scope %j", (payload) => {
    const action = command();
    expect(() => prepareNetworkCommand(base(), { ...action, payload: { ...action.payload, ...payload } } as NetworkCommandEnvelope)).toThrow();
  });
  it("preserves explicitly unknown/unavailable/null expiry and rejects invalid actors or historical command time", () => {
    const state = base(), action = command();
    for (const status of ["unknown", "unavailable"] as const) expect(prepareNetworkCommand(state, { ...action, payload: { ...action.payload, status, confirmationExpiresAt: null } }).snapshot.availabilityWindows.at(-1)!.status).toBe(status);
    for (const patch of [{ actorId: id("missing") }, { occurredAt: old }, { commandId: id("") }]) expect(() => prepareNetworkCommand(state, { ...action, context: { ...action.context, ...patch } })).toThrow();
  });
});

describe("Frozen sample compatibility", () => {
  it("preserves SD01–SD07 source records and all-market distinct identities across five markets", () => {
    const before = JSON.stringify(DEMO_SNAPSHOT_V2);
    const all = prepareNetworkView(DEMO_SNAPSHOT_V2, context(DEMO_SNAPSHOT_V2));
    expect(new Set(all.reporters.map((person) => person.reporterId)).size).toBe(all.reporters.length);
    for (const selectedMarket of ["LAX", "SFO", "DFW", "ORD", "ATL"] as const) {
      const view = prepareNetworkView(DEMO_SNAPSHOT_V2, context(DEMO_SNAPSHOT_V2, { selectedMarket }));
      expect(view.reporters.length).toBeGreaterThanOrEqual(5);
      expect(validateEvidenceBundle(view.evidence[0]!)).toEqual([]);
      expect(view.reporters.every((item) => all.reporters.some((other) => other.reporterId === item.reporterId))).toBe(true);
    }
    expect(JSON.stringify(DEMO_SNAPSHOT_V2)).toBe(before);
  });
});


describe("Exact source navigation and transaction composition", () => {
  it("uses actual job-market scope even when a reporter no longer declares that service market", () => {
    const prior = withJob(base(), "worked", "available", at("2026-02-15T17:00:00Z"), "SFO");
    const state = { ...prior, reporters: prior.reporters.map((person) => person.id === "available" ? { ...person, serviceMarketIds: ["LAX" as const] } : person) };
    expect(row(state, { selectedMarket: "SFO", marketBasis: "service-market" })).toBeUndefined();
    expect(row(state, { selectedMarket: "SFO", marketBasis: "job-market" }).recentJobCount).toBe(1);
    expect(row(state, { selectedMarket: "LAX", marketBasis: "service-market" }).recentJobCount).toBe(0);
    expect(row(state, { selectedMarket: "LAX", marketBasis: "job-market" })).toBeUndefined();
  });
  it("limits job-reference evidence to that work without changing the global first job", () => {
    let state = withJob(base(), "old", "available", at("2025-11-15T17:00:00Z"));
    state = withJob(state, "new", "available", at("2026-02-15T17:00:00Z"));
    expect(row(state, { recordRefs: [{ kind: "job-outcome", id: "job-old" }] }).recentJobCount).toBe(0);
    expect(row(state, { recordRefs: [{ kind: "job-outcome", id: "job-new" }] }).firstCompletedJob?.id).toBe("job-old");
  });
  it("targets known recruiting cases in their own market while clearing unrelated service filters", () => {
    const caseOne = { ...DEMO_SNAPSHOT_V2.acquisitionCases[0]!, id: id("case-sfo"), reporterId: id("available"), ownerMarketId: "SFO" as const, openedAt: old, recordedAt: old };
    const state = { ...base(), acquisitionCases: [caseOne, { ...caseOne, id: id("future"), openedAt: at("2026-02-17T00:00:00Z") }] };
    const target = row(state, { selectedMarket: "LAX", marketBasis: "service-market", attendanceModes: ["remote"] }).checklistTarget!;
    expect(target).toMatchObject({ workspace: "recruiting", filters: { selectedMarket: "SFO", marketBasis: "recruiting-market-at-entry", reporterIds: ["available"], acquisitionCaseIds: ["case-sfo"], recordRefs: [{ kind: "acquisition-case", id: "case-sfo" }], attendanceModes: [], capabilityCodes: [], requestIds: [], sourceIds: [] }, evidenceContext: { asOfAt: asOf, snapshotRevision: state.revision } });
    expect(row(base()).checklistTarget).toBeNull();
    const multiple = { ...state, acquisitionCases: [caseOne, { ...caseOne, id: id("case-atl"), ownerMarketId: "ATL" as const }] };
    expect(row(multiple).checklistTarget!.filters).toMatchObject({ selectedMarket: "ALL", marketIds: ["SFO", "ATL"], acquisitionCaseIds: ["case-sfo", "case-atl"] });
    expect(row(multiple, { acquisitionCaseIds: [id("case-atl")] }).checklistTarget!.filters).toMatchObject({ selectedMarket: "ATL", acquisitionCaseIds: ["case-atl"] });
  });
  it("persists only explicit availability through the canonical transaction and replays one saved record", async () => {
    const state = DEMO_SNAPSHOT_V2;
    const repository = createDemoRepositoryV2(state);
    const action = command(state);
    const explicit: NetworkCommandEnvelope = { ...action, payload: { ...action.payload, reporterId: state.reporters[0]!.id } };
    const saved = await commitV2Command(repository, explicit, prepareNetworkCommand);
    expect(saved.ok).toBe(true);
    if (!saved.ok) throw new Error(saved.message);
    expect(saved.value.revision).toBe(state.revision + 1);
    expect(saved.value.availabilityWindows).toHaveLength(state.availabilityWindows.length + 1);
    expect(saved.value.readinessEvents).toEqual(state.readinessEvents);
    expect(saved.value.assignmentEvents).toEqual(state.assignmentEvents);
    expect(saved.value.jobOutcomes).toEqual(state.jobOutcomes);
    const replayed = await commitV2Command(repository, explicit, prepareNetworkCommand);
    expect(replayed).toMatchObject({ ok: true, replayed: true, changed: false, revision: state.revision + 1 });
    const loaded = await repository.load();
    expect(loaded.ok && loaded.value.availabilityWindows.length).toBe(state.availabilityWindows.length + 1);
  });
});
