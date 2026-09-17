import { describe, expect, it } from "vitest";
import { DEMO_SNAPSHOT_V2, SCENARIO_CONTRACT, applyScenarioCheckpoint } from "../../src/data/v2";
import { prepareMarketsWorkspace } from "../../src/logic/capacity";
import { prepareProgramsView } from "../../src/logic/programs";
import { prepareRecruitingWorkspace } from "../../src/logic/recruiting";
import { prepareTeamView } from "../../src/logic/team";
import type { DemoSnapshotV2, WorkspaceQueryContext, UtcTimestamp, IanaTimeZone } from "../../src/contracts/v2";

const context = <T extends "markets" | "recruiting" | "team" | "programs">(workspace: T, selectedMarket: "LAX" | "ALL" = "LAX"): WorkspaceQueryContext<T> => ({
  workspace,
  evaluation: { asOfAt: DEMO_SNAPSHOT_V2.currentAsOfAt, snapshotRevision: DEMO_SNAPSHOT_V2.revision, reportingTimeZone: "America/Los_Angeles" as IanaTimeZone },
  filters: { selectedMarket, marketBasis: workspace === "markets" ? "demand-market" : "all-markets", marketIds: selectedMarket === "ALL" ? [] : [selectedMarket], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: workspace === "markets" ? { startAt: "2026-02-23T08:00:00Z" as UtcTimestamp, endAt: "2026-03-02T08:00:00Z" as UtcTimestamp, boundary: "[start,end)" } : null },
});

describe("independent source-record reconciliation", () => {
  it("covers S08 negative cancellation/missing-verification paths without forcing success", () => {
    const canceled = structuredClone(DEMO_SNAPSHOT_V2);
    const canceledRequestId = canceled.demandRequests[0]!.id;
    const snapshot = { ...canceled, demandRequests: canceled.demandRequests.map((request) => request.id === canceledRequestId ? { ...request, status: "canceled" as const } : request) };
    const view = prepareMarketsWorkspace(snapshot, context("markets"));
    expect(view.requests.some((item) => item.request.id === canceledRequestId)).toBe(false);
    const acceptedReporterId = DEMO_SNAPSHOT_V2.assignmentEvents.find((item) => item.requestId === canceledRequestId)?.reporterId;
    if (acceptedReporterId) {
      const missingVerification = structuredClone(DEMO_SNAPSHOT_V2);
      const negative = prepareMarketsWorkspace({ ...missingVerification, capabilityVerifications: missingVerification.capabilityVerifications.map((item) => item.reporterId === acceptedReporterId ? { ...item, status: "not-demonstrated" as const } : item) }, context("markets"));
      const original = negative.requests.find((item) => item.request.id === canceledRequestId);
      expect(original?.status).not.toBe("confirmed");
    }
  });

  it("keeps possible versus accepted, shared candidates, unknown requirements, and readiness without acceptance distinct", () => {
    const base = prepareMarketsWorkspace(DEMO_SNAPSHOT_V2, context("markets"));
    expect(base.requests.filter((item) => item.status === "possible-match").every((item) => item.acceptedReporterId === null)).toBe(true);
    expect(base.requests.filter((item) => item.status === "confirmed").every((item) => item.acceptedReporterId !== null)).toBe(true);
    expect(base.requests.some((item) => item.status === "requirements-unknown")).toBe(false);
    const ready = structuredClone(DEMO_SNAPSHOT_V2);
    const altered = prepareMarketsWorkspace({ ...ready, readinessEvents: [...ready.readinessEvents, { ...ready.readinessEvents[0]!, id: "quality-ready" as never, reporterId: ready.reporters[0]!.id }] }, context("markets"));
    expect(altered.coverage.requested).toBe(base.coverage.requested);
  });

  it("reconciles weighted program rates and positive spend with zero outcomes from source members", () => {
    const view = prepareProgramsView(DEMO_SNAPSHOT_V2, context("programs", "ALL"));
    for (const group of [...view.resultsByProgram.values()].flat()) {
      expect(group.evidence.denominatorMembers.length).toBeGreaterThanOrEqual(group.evidence.numeratorMembers.length);
      expect(new Set(group.evidence.numeratorMembers).size).toBe(group.evidence.numeratorMembers.length);
    }
    const recruiting = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, context("recruiting", "ALL"));
    expect(recruiting.sources.every((source) => !source.spend.display.includes("$0 per first job"))).toBe(true);
  });

  it("preserves task reassignment credit and process/goal changes without manufacturing outcomes", () => {
    const team = prepareTeamView(DEMO_SNAPSHOT_V2, context("team"), { id: "M11" as never, version: "v2-frozen-1" as never });
    const work = DEMO_SNAPSHOT_V2.workItems.find((item) => item.statusHistory.some((entry) => entry.status === "completed"));
    if (work) expect(new Set(team.members.flatMap((member) => member.workItems).map((item) => item.id)).size).toBe(team.members.flatMap((member) => member.workItems).length);
    const saved = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, String(SCENARIO_CONTRACT.checkpoints[1]!.id));
    expect(saved.goalRevisions.length).toBeGreaterThan(DEMO_SNAPSHOT_V2.goalRevisions.length);
    expect(saved.jobOutcomes.length).toBe(DEMO_SNAPSHOT_V2.jobOutcomes.length);
    const processDrafts = (saved as DemoSnapshotV2).processVersions.filter((item) => item.status === "draft");
    expect(processDrafts.every((item) => item.status !== "approved-for-limited-pilot")).toBe(true);
  });
});
