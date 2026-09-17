import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2, WorkspaceQueryContext } from "../../contracts/v2";
import { TEAM_WORKSPACE, prepareTeamView } from "./index";

const asOf = "2026-03-10T00:00:00.000Z";
const actorA = "actor-a" as never; const actorB = "actor-b" as never;
const memberA = "member-a" as never; const memberB = "member-b" as never;
const metric = { id: "team-completions" as never, version: "v1" as never };
const context = {
  workspace: TEAM_WORKSPACE, evaluation: { asOfAt: asOf as never, snapshotRevision: 4, reportingTimeZone: "America/Los_Angeles" as never },
  filters: { selectedMarket: "LAX", marketBasis: "demand-market", marketIds: ["LAX"], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: { startAt: "2026-03-01T00:00:00.000Z" as never, endAt: "2026-04-01T00:00:00.000Z" as never, boundary: "[start,end)" } },
} as WorkspaceQueryContext<typeof TEAM_WORKSPACE>;
const snapshot = {
  revision: 4,
  demandRequests: [{ id: "req-lax", marketId: "LAX" }],
  metricDefinitions: [{ id: metric.id, version: metric.version, unit: "tasks" }],
  teamMembers: [
    { id: memberA, actorId: actorA, fictionalName: "Jun", focusRole: "Recruiter", activeFrom: "2026-01-01T00:00:00.000Z", activeTo: null },
    { id: memberB, actorId: actorB, fictionalName: "Sky", focusRole: "Recruiter", activeFrom: "2026-01-01T00:00:00.000Z", activeTo: null },
  ],
  workItems: [
    { id: "completed-once", kind: "screen", primaryEntityRef: { kind: "reporter", id: "reporter-1" }, relatedRequestIds: ["req-lax"], createdAt: "2026-03-01T00:00:00.000Z", ownerHistory: [{ ownerId: memberA, occurredAt: "2026-03-01T00:00:00.000Z", actorId: actorA, reason: "Initial" }, { ownerId: memberB, occurredAt: "2026-03-05T00:00:00.000Z", actorId: actorB, reason: "Reassigned after completion" }], dueAt: null, statusHistory: [{ status: "completed", occurredAt: "2026-03-04T00:00:00.000Z", actorId: actorA, reason: "Done" }, { status: "completed", occurredAt: "2026-03-06T00:00:00.000Z", actorId: actorA, reason: "Repeated processing" }], blockerCode: null, completionEvidenceRefs: [], programId: null },
    { id: "open-overdue", kind: "onboard", primaryEntityRef: { kind: "reporter", id: "reporter-2" }, relatedRequestIds: ["req-lax"], createdAt: "2026-03-01T00:00:00.000Z", ownerHistory: [{ ownerId: memberB, occurredAt: "2026-03-01T00:00:00.000Z", actorId: actorA, reason: "Assigned" }], dueAt: "2026-03-09T00:00:00.000Z", statusHistory: [{ status: "open", occurredAt: "2026-03-01T00:00:00.000Z", actorId: actorA, reason: "Created" }], blockerCode: null, completionEvidenceRefs: [], programId: null },
  ],
  workQualityChecks: [{ id: "quality-1", workItemId: "completed-once", checkedBy: memberA, checkedAt: "2026-03-07T00:00:00.000Z", requiredCheckResults: [{ checkCode: "complete", passed: true, reason: "Observed" }], outcome: "passed" }],
  teamTargets: [{ id: "target-1", teamMemberId: null, role: "Recruiter", metric, target: 2, reportingWindow: context.filters.window, createdAt: "2026-03-01T00:00:00.000Z", rationale: "Same unit" }],
  coachingActions: [{ id: "coach-1", teamMemberId: memberA, linkedWorkItemIds: ["completed-once"], observedIssueOrStrength: "Clear handoff notes", expectedPractice: "Share the handoff template", nextAction: "Review one new example", dueAt: "2026-03-12T00:00:00.000Z", reviewAt: "2026-03-15T00:00:00.000Z", outcomeNote: null, authorId: actorB, createdAt: "2026-03-08T00:00:00.000Z" }],
  readinessEvents: [], assignmentEvents: [], jobOutcomes: [],
} as unknown as DemoSnapshotV2;

describe("prepareTeamView", () => {
  it("keeps historical completion credit with the completion actor after reassignment and prevents duplicate credit", () => {
    const view = prepareTeamView(snapshot, context, metric);
    expect(view.members.find((member) => member.id === memberA)?.completed.completed).toBe(1);
    expect(view.members.find((member) => member.id === memberB)?.completed.completed).toBe(0);
    expect(view.members.find((member) => member.id === memberB)?.totalOpenWorkload).toBe(1);
  });
  it("shows inspected samples and explicit coaching without fabricating readiness, assignments, or outcomes", () => {
    const view = prepareTeamView(snapshot, context, metric);
    const jun = view.members.find((member) => member.id === memberA)!;
    expect(jun.quality).toMatchObject({ inspectedCount: 1, passedCount: 1, ratio: 1 });
    expect(jun.coachingActions[0]?.observedIssueOrStrength).toBe("Clear handoff notes");
    expect(snapshot.readinessEvents).toEqual([]);
    expect(snapshot.assignmentEvents).toEqual([]);
    expect(snapshot.jobOutcomes).toEqual([]);
  });
  it("excludes inspections outside the reporting window", () => {
    const withEarlierCheck = { ...snapshot, workQualityChecks: [...snapshot.workQualityChecks, { ...snapshot.workQualityChecks[0]!, id: "quality-old" as never, workItemId: "open-overdue" as never, checkedAt: "2026-02-28T23:59:59.000Z" as never }] } as DemoSnapshotV2;
    const jun = prepareTeamView(withEarlierCheck, context, metric).members.find((member) => member.id === memberA)!;
    expect(jun.quality.inspectedCount).toBe(1);
    expect(jun.quality.sample.map((sample) => sample.workItemId)).not.toContain("open-overdue");
  });
  it("prefers an explicit member target over a role target regardless of target order", () => {
    const memberTarget = { ...snapshot.teamTargets[0]!, id: "target-member" as never, teamMemberId: memberA, target: 5 };
    const withBothTargets = { ...snapshot, teamTargets: [snapshot.teamTargets[0]!, memberTarget] } as DemoSnapshotV2;
    const jun = prepareTeamView(withBothTargets, context, metric).members.find((member) => member.id === memberA)!;
    expect(jun.completed.target).toBe(5);
  });
});
