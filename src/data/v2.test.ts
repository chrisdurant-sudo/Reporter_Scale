import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2 } from "../contracts/v2";
import {
  DEMO_SNAPSHOT_V2,
  SCENARIO_CONTRACT,
  V2_RECORD_COUNTS,
  applyScenarioCheckpoint,
  createDemoRepositoryV2,
  validateDemoSnapshot,
} from "./v2";

const laxMainIds = Array.from({ length: 10 }, (_, index) => `req-lax-${101 + index}`);

describe("V2 synthetic records and repository", () => {
  it("D01 resolves the complete seed graph without duplicate canonical identities", () => {
    const checked = validateDemoSnapshot(DEMO_SNAPSHOT_V2);
    expect(checked.ok).toBe(true);
    expect(DEMO_SNAPSHOT_V2.markets.map((market) => [market.id, market.timeZone])).toEqual([
      ["LAX", "America/Los_Angeles"],
      ["SFO", "America/Los_Angeles"],
      ["DFW", "America/Chicago"],
      ["ORD", "America/Chicago"],
      ["ATL", "America/New_York"],
    ]);
    expect(new Set(DEMO_SNAPSHOT_V2.reporters.map((reporter) => reporter.id)).size).toBe(DEMO_SNAPSHOT_V2.reporters.length);
    expect(V2_RECORD_COUNTS).toMatchObject({ markets: 5, laxMainRequests: 10, baselineAcceptedAssignments: 6, checklistEnrollments: 40 });
  });

  it("D02 keeps future people, readiness, acceptances, and outcomes outside the baseline", () => {
    expect(DEMO_SNAPSHOT_V2.reporters.some((reporter) => reporter.id === "person-lax-010")).toBe(false);
    expect(DEMO_SNAPSHOT_V2.readinessEvents.some((event) => event.reporterId === "person-lax-009" || event.reporterId === "person-lax-010")).toBe(false);
    expect(DEMO_SNAPSHOT_V2.assignmentEvents.filter((event) => laxMainIds.includes(event.requestId))).toHaveLength(6);
    expect(DEMO_SNAPSHOT_V2.jobOutcomes.some((outcome) => laxMainIds.includes(outcome.requestId))).toBe(false);
    expect(DEMO_SNAPSHOT_V2.demandRequests.filter((request) => laxMainIds.includes(request.id))).toHaveLength(10);
  });

  it("D03 reconstructs the forty-person checklist histories from explicit member records", () => {
    const enrollments = DEMO_SNAPSHOT_V2.programEnrollments.filter((item) => item.programId === "program-readiness-checklist");
    expect(enrollments).toHaveLength(40);
    expect(new Set(enrollments.map((item) => item.reporterId)).size).toBe(40);
    const outcomes = new Map(DEMO_SNAPSHOT_V2.jobOutcomes.map((outcome) => [outcome.reporterId, outcome]));
    const result = (group: string, market?: string) => {
      const members = enrollments.filter((item) => item.groupId === group && (!market || item.marketAtEntry === market));
      return [members.filter((item) => outcomes.has(item.reporterId)).length, members.length];
    };
    expect(result("earlier")).toEqual([6, 20]);
    expect(result("pilot")).toEqual([11, 20]);
    expect(result("earlier", "LAX")).toEqual([3, 10]);
    expect(result("pilot", "LAX")).toEqual([6, 10]);
    expect(result("earlier", "SFO")).toEqual([3, 10]);
    expect(result("pilot", "SFO")).toEqual([5, 10]);
    expect(enrollments.every((item) => DEMO_SNAPSHOT_V2.lifecycleEvents.some((event) => event.reporterId === item.reporterId && event.eventType === "onboarding-started"))).toBe(true);
  });

  it("D04 preserves differentiated unknown, expired, unavailable, and blocked evidence", () => {
    expect(DEMO_SNAPSHOT_V2.availabilityWindows.find((item) => item.id === "availability-sfo-unknown")?.status).toBe("unknown");
    expect(DEMO_SNAPSHOT_V2.availabilityWindows.find((item) => item.id === "availability-atl-expired")?.confirmationExpiresAt).toBe("2026-02-10T17:00:00Z");
    expect(DEMO_SNAPSHOT_V2.onboardingSteps.filter((item) => item.blockerCode === "same-required-step-missing")).toHaveLength(3);
    expect(DEMO_SNAPSHOT_V2.programDecisions.find((item) => item.programId === "program-dfw-broad-outreach")).toMatchObject({ decision: "stop" });
    expect(DEMO_SNAPSHOT_V2.sourceSpend.find((item) => item.programId === "program-dfw-broad-outreach")?.amountMinor).toBe(360000);
  });

  it("D05 rejects broken outcome references, double acceptance, overlap, and invalid intervals", () => {
    const broken = { ...structuredClone(DEMO_SNAPSHOT_V2), jobOutcomes: [{ ...DEMO_SNAPSHOT_V2.jobOutcomes[0]!, acceptedAssignmentEventId: "missing" as never }] };
    expect(validateDemoSnapshot(broken).ok).toBe(false);

    const duplicate = { ...structuredClone(DEMO_SNAPSHOT_V2), assignmentEvents: [...DEMO_SNAPSHOT_V2.assignmentEvents, { ...DEMO_SNAPSHOT_V2.assignmentEvents[0]!, id: "duplicate-acceptance" as never, reporterId: DEMO_SNAPSHOT_V2.reporters[1]!.id }] };
    expect(validateDemoSnapshot(duplicate).ok).toBe(false);

    const overlap = { ...structuredClone(DEMO_SNAPSHOT_V2), assignmentEvents: [...DEMO_SNAPSHOT_V2.assignmentEvents, { ...DEMO_SNAPSHOT_V2.assignmentEvents[0]!, id: "overlap-acceptance" as never, requestId: "req-lax-102" as never }] };
    expect(validateDemoSnapshot(overlap).ok).toBe(false);

    const invalidWindow = { ...structuredClone(DEMO_SNAPSHOT_V2), availabilityWindows: [{ ...DEMO_SNAPSHOT_V2.availabilityWindows[0]!, endAt: DEMO_SNAPSHOT_V2.availabilityWindows[0]!.startAt }] };
    expect(validateDemoSnapshot(invalidWindow).ok).toBe(false);

    const invalidReadiness = { ...structuredClone(DEMO_SNAPSHOT_V2), readinessEvents: [{ ...DEMO_SNAPSHOT_V2.readinessEvents[0]!, checkedStepIds: [DEMO_SNAPSHOT_V2.onboardingSteps.find((step) => step.state !== "completed")!.id] }] };
    expect(validateDemoSnapshot(invalidReadiness).ok).toBe(false);

    const omittedRequiredStep = { ...structuredClone(DEMO_SNAPSHOT_V2), readinessEvents: [{ ...DEMO_SNAPSHOT_V2.readinessEvents[0]!, checkedStepIds: [] }] };
    expect(validateDemoSnapshot(omittedRequiredStep).ok).toBe(false);

    const unverifiedCapability = { ...structuredClone(DEMO_SNAPSHOT_V2), capabilityVerifications: DEMO_SNAPSHOT_V2.capabilityVerifications.map((capability, index) => index === 0 ? { ...capability, status: "not-demonstrated" as const } : capability) };
    expect(validateDemoSnapshot(unverifiedCapability).ok).toBe(false);

    const futureReadinessEvidence = { ...structuredClone(DEMO_SNAPSHOT_V2), capabilityVerifications: DEMO_SNAPSHOT_V2.capabilityVerifications.map((capability, index) => index === 0 ? { ...capability, recordedAt: "2026-03-01T00:00:00Z" as never } : capability) };
    expect(validateDemoSnapshot(futureReadinessEvidence).ok).toBe(false);

    const invalidAcceptance = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-101" ? { ...request, requiredCapabilityCodes: ["missing-capability" as never] } : request) };
    expect(validateDemoSnapshot(invalidAcceptance).ok).toBe(false);

    const missingAvailability = { ...structuredClone(DEMO_SNAPSHOT_V2), availabilityWindows: DEMO_SNAPSHOT_V2.availabilityWindows.filter((window) => window.reporterId !== "person-lax-001") };
    expect(validateDemoSnapshot(missingAvailability).ok).toBe(false);

    const historicalEligibility = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-history-001" ? { ...request, requiredCapabilityCodes: ["missing-capability" as never] } : request) };
    expect(validateDemoSnapshot(historicalEligibility).ok).toBe(false);

    const credential = { id: "credential-test" as never, reporterId: "person-lax-001" as never, label: "sample-cert", issuerLabel: "Fictional issuer", jurisdictionScope: "CA", verificationStatus: "verified" as const, verifiedAt: "2026-02-01T00:00:00Z" as never, validFrom: "2026-02-01T00:00:00Z" as never, validUntil: "2026-03-01T00:00:00Z" as never, recordedAt: "2026-02-01T00:00:00Z" as never, evidenceRef: { kind: "reporter", id: "person-lax-001" }, provenance: "synthetic-demo" as const };
    const credentialSnapshot = (requirement: Record<string, unknown>, replacement = credential) => ({ ...structuredClone(DEMO_SNAPSHOT_V2), credentialRecords: [replacement], demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-101" ? { ...request, sampleCredentialRequirements: [requirement] } : request) });
    const validRequirement = { requirementCode: "sample-cert", label: "Sample certificate", jurisdictionScope: "CA", samplePolicyNote: "Fictional test requirement." };
    expect(validateDemoSnapshot(credentialSnapshot({ ...validRequirement, requirementCode: "wrong-code" })).ok).toBe(false);
    expect(validateDemoSnapshot(credentialSnapshot({ ...validRequirement, jurisdictionScope: "NY" })).ok).toBe(false);
    expect(validateDemoSnapshot(credentialSnapshot(validRequirement, { ...credential, validUntil: "2026-02-23T19:00:00Z" as never })).ok).toBe(false);
    const wrongServiceMarket = { ...structuredClone(DEMO_SNAPSHOT_V2), reporters: DEMO_SNAPSHOT_V2.reporters.map((reporter) => reporter.id === "person-lax-001" ? { ...reporter, preferences: { ...reporter.preferences, serviceMarkets: reporter.preferences.serviceMarkets.map((preference) => preference.marketId === "LAX" ? { ...preference, status: "needs-confirmation" as const } : preference) } } : reporter) };
    expect(validateDemoSnapshot(wrongServiceMarket).ok).toBe(false);
    const wrongAttendance = { ...structuredClone(DEMO_SNAPSHOT_V2), reporters: DEMO_SNAPSHOT_V2.reporters.map((reporter) => reporter.id === "person-lax-001" ? { ...reporter, preferences: { ...reporter.preferences, attendanceModes: [] } } : reporter) };
    expect(validateDemoSnapshot(wrongAttendance).ok).toBe(false);
    const missingServiceScope = { ...structuredClone(DEMO_SNAPSHOT_V2), reporters: DEMO_SNAPSHOT_V2.reporters.map((reporter) => reporter.id === "person-lax-001" ? { ...reporter, serviceMarketIds: [] } : reporter) };
    expect(validateDemoSnapshot(missingServiceScope).ok).toBe(false);
    const unsupportedProceeding = { ...structuredClone(DEMO_SNAPSHOT_V2), reporters: DEMO_SNAPSHOT_V2.reporters.map((reporter) => reporter.id === "person-lax-001" ? { ...reporter, preferences: { ...reporter.preferences, supportedProceedingTypes: [] } } : reporter) };
    expect(validateDemoSnapshot(unsupportedProceeding).ok).toBe(false);
    const closedAtAcceptance = { ...structuredClone(DEMO_SNAPSHOT_V2), lifecycleEvents: [...DEMO_SNAPSHOT_V2.lifecycleEvents, { ...DEMO_SNAPSHOT_V2.lifecycleEvents.find((event) => event.reporterId === "person-lax-001")!, id: "closed-test" as never, eventType: "closed" as const, occurredAt: "2026-02-13T17:00:00Z" as never, recordedAt: "2026-02-13T17:00:00Z" as never }] };
    expect(validateDemoSnapshot(closedAtAcceptance).ok).toBe(false);
    const explicitUnavailable = { ...structuredClone(DEMO_SNAPSHOT_V2), availabilityWindows: [...DEMO_SNAPSHOT_V2.availabilityWindows, { ...DEMO_SNAPSHOT_V2.availabilityWindows[0]!, id: "unavailable-test" as never, status: "unavailable" as const }] };
    expect(validateDemoSnapshot(explicitUnavailable).ok).toBe(false);
    const supersededCapability = { ...structuredClone(DEMO_SNAPSHOT_V2), capabilityVerifications: [...DEMO_SNAPSHOT_V2.capabilityVerifications, { ...DEMO_SNAPSHOT_V2.capabilityVerifications[0]!, id: "superseding-capability" as never, status: "not-demonstrated" as const, recordedAt: "2026-02-12T18:00:00Z" as never }] };
    expect(validateDemoSnapshot(supersededCapability).ok).toBe(false);
    const canceledRequest = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-101" ? { ...request, status: "canceled" as const } : request) };
    expect(validateDemoSnapshot(canceledRequest).ok).toBe(false);
    const blankRequirementsVersion = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-101" ? { ...request, requirementsVersion: " " } : request) };
    expect(validateDemoSnapshot(blankRequirementsVersion).ok).toBe(false);
    const blankProceeding = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-101" ? { ...request, proceedingType: " " as never } : request) };
    expect(validateDemoSnapshot(blankProceeding).ok).toBe(false);
    const noRequirements = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-101" ? { ...request, requiredCapabilityCodes: [], sampleCredentialRequirements: [] } : request) };
    expect(validateDemoSnapshot(noRequirements).ok).toBe(false);
    const unknownRequirements = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: DEMO_SNAPSHOT_V2.demandRequests.map((request) => request.id === "req-lax-101" ? { ...request, sampleCredentialRequirements: [{ ...validRequirement, requirementCode: "" }] } : request) };
    expect(validateDemoSnapshot(unknownRequirements).ok).toBe(false);

    const futureRecordedReadiness = { ...structuredClone(DEMO_SNAPSHOT_V2), readinessEvents: DEMO_SNAPSHOT_V2.readinessEvents.map((event, index) => index === 0 ? { ...event, recordedAt: "2026-03-01T00:00:00Z" as never } : event) };
    expect(validateDemoSnapshot(futureRecordedReadiness).ok).toBe(false);

    const invalidCompletion = { ...structuredClone(DEMO_SNAPSHOT_V2), jobOutcomes: [{ ...DEMO_SNAPSHOT_V2.jobOutcomes[0]!, completedAt: DEMO_SNAPSHOT_V2.assignmentEvents.find((event) => event.id === DEMO_SNAPSHOT_V2.jobOutcomes[0]!.acceptedAssignmentEventId)!.occurredAt }] };
    expect(validateDemoSnapshot(invalidCompletion).ok).toBe(false);

    const invalidTimeZone = { ...structuredClone(DEMO_SNAPSHOT_V2), demandRequests: [{ ...DEMO_SNAPSHOT_V2.demandRequests[0]!, timeZone: "America/New_York" as never }] };
    expect(validateDemoSnapshot(invalidTimeZone).ok).toBe(false);
  });

  it("D06 applies cumulative checkpoints once and keeps dependent records ordered", () => {
    const existing = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "existing-acceptances");
    expect(existing.assignmentEvents.filter((event) => laxMainIds.includes(event.requestId) && event.state === "accepted")).toHaveLength(8);
    const ready = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "two-new-ready");
    expect(ready.reporters.some((reporter) => reporter.id === "person-lax-010")).toBe(true);
    expect(ready.readinessEvents.filter((event) => event.reporterId === "person-lax-009" || event.reporterId === "person-lax-010")).toHaveLength(2);
    const accepted = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "new-acceptances");
    expect(accepted.assignmentEvents.filter((event) => laxMainIds.includes(event.requestId) && event.state === "accepted")).toHaveLength(10);
    const delivered = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "original-plan-delivered");
    expect(delivered.jobOutcomes.filter((outcome) => laxMainIds.includes(outcome.requestId) && outcome.outcome === "completed")).toHaveLength(10);
    expect(validateDemoSnapshot(delivered).ok).toBe(true);
    const replayed = applyScenarioCheckpoint(delivered, "original-plan-delivered");
    expect(replayed.appliedScenarioEventIds).toEqual(delivered.appliedScenarioEventIds);
    expect(replayed.revision).toBe(delivered.revision);
    expect(SCENARIO_CONTRACT.feed.events.map((event) => event.sequence)).toEqual(SCENARIO_CONTRACT.feed.events.map((_, index) => index + 1));
    for (const checkpoint of SCENARIO_CONTRACT.checkpoints) expect(validateDemoSnapshot(applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, checkpoint.id)).ok).toBe(true);
  });

  it("D06 repository isolates mutations, rejects stale saves, and resets all state", async () => {
    const repository = createDemoRepositoryV2();
    const first = await repository.load();
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    (first.value.reporters as DemoSnapshotV2["reporters"][number][]).pop();
    const isolated = await repository.load();
    expect(isolated.ok && isolated.value.reporters).toHaveLength(DEMO_SNAPSHOT_V2.reporters.length);
    if (!isolated.ok) return;
    const advanced = applyScenarioCheckpoint(isolated.value, "plan-saved");
    const saved = await repository.save(advanced, isolated.revision);
    expect(saved.ok).toBe(true);
    const stale = await repository.save(isolated.value, isolated.revision);
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.errors[0]?.code).toBe("stale-revision");
    const reset = await repository.reset();
    expect(reset.ok && reset.value).toMatchObject({ revision: 0, appliedScenarioEventIds: [], appliedCommandIds: [] });
    expect(reset.ok && reset.value.goalRevisions.map((item) => item.id)).toEqual(DEMO_SNAPSHOT_V2.goalRevisions.map((item) => item.id));
  });
});
