import { describe, expect, it } from "vitest";
import type { SelectedMarket, WorkspaceFilterPayload, WorkspaceId, WorkspaceQueryContext } from "../contracts/v2";
import { DEMO_SNAPSHOT_V2, V2_MAIN_REQUEST_WINDOW, applyScenarioCheckpoint } from "../data/v2";
import { prepareMarketsWorkspace } from "../logic/capacity";
import { prepareNetworkView } from "../logic/network";
import { prepareProgramsView, prepareWeeklyProgramsReview } from "../logic/programs";
import { onboardingOutcomes, prepareRecruitingWorkspace } from "../logic/recruiting";
import { validateEvidenceBundle } from "../logic/shared";
import { prepareTeamView } from "../logic/team";

const laxRequestIds = Array.from({ length: 10 }, (_, index) => `req-lax-${101 + index}` as never);
const at = (value: string) => value as never;

function filters(selectedMarket: SelectedMarket, marketBasis: WorkspaceFilterPayload["marketBasis"], requestIds = laxRequestIds, window: WorkspaceFilterPayload["window"] = V2_MAIN_REQUEST_WINDOW): WorkspaceFilterPayload {
  return {
    selectedMarket,
    marketBasis,
    marketIds: selectedMarket === "ALL" ? [] : [selectedMarket],
    reporterIds: [], acquisitionCaseIds: [], requestIds, workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [],
    capabilityCodes: [], attendanceModes: [], recordRefs: [], window,
  };
}

function context<TWorkspace extends WorkspaceId>(workspace: TWorkspace, asOfAt: string, payload: WorkspaceFilterPayload, revision = 0): WorkspaceQueryContext<TWorkspace> {
  return { workspace, evaluation: { asOfAt: at(asOfAt), snapshotRevision: revision, reportingTimeZone: "America/Los_Angeles" as never }, filters: payload };
}

describe("P2 source → calculation → EvidenceBundle reconciliation", () => {
  it("derives every frozen LAX capacity checkpoint from cumulative source events", () => {
    const cases = [
      ["baseline", [6, 2, 2, 0]],
      ["plan-saved", [6, 2, 2, 0]],
      ["existing-acceptances", [8, 0, 2, 0]],
      ["two-new-ready", [8, 2, 0, 2]],
      ["new-acceptances", [10, 0, 0, 2]],
    ] as const;
    for (const [checkpointId, expected] of cases) {
      const snapshot = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, checkpointId);
      const view = prepareMarketsWorkspace(snapshot, context("markets", snapshot.currentAsOfAt, filters("LAX", "demand-market"), snapshot.revision));
      expect([view.coverage.confirmed, view.coverage.possible, view.coverage.noVerifiedReadyMatch, view.growthGoal?.actual ?? 0], checkpointId).toEqual(expected);
      expect(view.coverage.confirmed + view.coverage.possible + view.coverage.noVerifiedReadyMatch + view.coverage.requirementsUnknown).toBe(10);
      expect(view.evidence.flatMap(validateEvidenceBundle), checkpointId).toEqual([]);
    }
  });

  it("derives ten completed frozen-plan requests and only Avery/Rowan as first jobs", () => {
    const snapshot = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "original-plan-delivered");
    const view = prepareMarketsWorkspace(snapshot, context("markets", snapshot.currentAsOfAt, filters("LAX", "demand-market"), snapshot.revision));
    expect(view.coverage.requested).toBe(0);
    expect(view.originalPlan).toMatchObject({ status: "available", completedRequests: 10, firstJobs: 2 });
    expect(view.originalPlan.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
    const firstJobIds = view.originalPlan.evidence.find((item) => item.id.includes("first-jobs"))?.contributingRecords.map((record) => record.id).sort();
    expect(firstJobIds).toEqual(["outcome-req-lax-109", "outcome-req-lax-110"]);
  });

  it("derives the mature Avery/Rowan onboarding result as one timely and two completed", () => {
    const snapshot = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "pair-cohort-mature");
    const entryWindow = { startAt: at("2026-02-01T00:00:00Z"), endAt: at("2026-03-01T00:00:00Z"), boundary: "[start,end)" as const };
    const outcome = onboardingOutcomes(snapshot, snapshot.currentAsOfAt, entryWindow, "LAX");
    expect([...outcome.matureCaseIds].sort()).toEqual(["case-lax-009", "case-lax-010"]);
    expect(outcome.timelyCaseIds).toEqual(["case-lax-010"]);
    expect([...outcome.completedToDateCaseIds].sort()).toEqual(["case-lax-009", "case-lax-010"]);
    expect(outcome.rate).toBe(0.5);
    const view = prepareRecruitingWorkspace(snapshot, context("recruiting", snapshot.currentAsOfAt, filters("LAX", "recruiting-market-at-entry", [], entryWindow), snapshot.revision));
    expect(view.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
  });

  it("reconstructs the checklist pilot overall and by entry market without averaging percentages", () => {
    const allFilters = { ...filters("ALL", "program-market-at-entry", [], null), programIds: ["program-readiness-checklist" as never] };
    const all = prepareProgramsView(DEMO_SNAPSHOT_V2, context("programs", DEMO_SNAPSHOT_V2.currentAsOfAt, allFilters));
    const allGroups = all.resultsByProgram.get("program-readiness-checklist" as never)!;
    expect(allGroups.map((group) => [group.groupId, group.timelyFirstJobs, group.matureEntrants])).toEqual([["earlier", 6, 20], ["pilot", 11, 20]]);
    for (const [market, expected] of [["LAX", [[3, 10], [6, 10]]], ["SFO", [[3, 10], [5, 10]]]] as const) {
      const marketView = prepareProgramsView(DEMO_SNAPSHOT_V2, context("programs", DEMO_SNAPSHOT_V2.currentAsOfAt, { ...allFilters, selectedMarket: market, marketIds: [market] }));
      expect(marketView.resultsByProgram.get("program-readiness-checklist" as never)!.map((group) => [group.timelyFirstJobs, group.matureEntrants])).toEqual(expected);
    }
    expect(all.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
  });

  it("keeps supporting-market situations and unknowns materially distinct", () => {
    const sfo = prepareMarketsWorkspace(DEMO_SNAPSHOT_V2, context("markets", DEMO_SNAPSHOT_V2.currentAsOfAt, filters("SFO", "demand-market", ["req-sfo-in-person-201" as never], { startAt: at("2026-02-25T00:00:00Z"), endAt: at("2026-02-26T00:00:00Z"), boundary: "[start,end)" })));
    expect(sfo.coverage).toMatchObject({ requested: 1, confirmed: 0, possible: 0, noVerifiedReadyMatch: 1 });
    expect(sfo.requests[0]?.candidates.find((candidate) => candidate.reporterId === "person-sfo-availability-01")?.unknowns.join(" ")).toMatch(/Availability is unknown/i);
    expect(DEMO_SNAPSHOT_V2.onboardingSteps.filter((step) => step.blockerCode === "same-required-step-missing")).toHaveLength(3);
    expect(DEMO_SNAPSHOT_V2.programDecisions.find((decision) => decision.programId === "program-dfw-broad-outreach")).toMatchObject({ decision: "stop" });
    const atl = prepareNetworkView(DEMO_SNAPSHOT_V2, context("reporters", DEMO_SNAPSHOT_V2.currentAsOfAt, filters("ATL", "service-market", [], null)));
    expect(atl.reporters.map((reporter) => reporter.availability).sort()).toEqual(["expired", "unknown"]);
    expect(atl.reengagementCandidates).toHaveLength(2);
    expect(atl.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
  });

  it("reconciles Team and M13 weekly evidence without composite people scores", () => {
    const teamWindow = { startAt: at("2026-01-10T00:00:00Z"), endAt: at("2026-01-17T00:00:00Z"), boundary: "[start,end)" as const };
    const teamContext = context("team", DEMO_SNAPSHOT_V2.currentAsOfAt, filters("ALL", "all-markets", [], teamWindow));
    const team = prepareTeamView(DEMO_SNAPSHOT_V2, teamContext, { id: "M11" as never, version: "v2-frozen-1" as never });
    expect(team.members.find((member) => member.id === "team-2")?.quality).toMatchObject({ inspectedCount: 1, passedCount: 1, ratio: 1 });
    expect(team.members.flatMap((member) => member.coachingActions).some((action) => action.observedIssueOrStrength.includes("descriptive evidence"))).toBe(true);
    expect(team.evidence.flatMap(validateEvidenceBundle)).toEqual([]);

    const programFilters = { ...filters("ALL", "program-market-at-entry", [], teamWindow), programIds: ["program-dfw-broad-outreach" as never] };
    const weekly = prepareWeeklyProgramsReview(DEMO_SNAPSHOT_V2, context("programs", "2026-01-16T00:00:00Z", programFilters));
    expect(weekly.isPartial).toBe(true);
    expect(weekly.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
  });
});
