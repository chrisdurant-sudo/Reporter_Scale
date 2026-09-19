import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2, UtcTimestamp, WorkspaceQueryContext } from "../contracts/v2";
import { REPORTING_TIME_ZONE } from "../contracts/v2";
import { applyScenarioCheckpoint, DEMO_SNAPSHOT_V2, V2_MAIN_REQUEST_WINDOW } from "../data/v2";
import { prepareMarketsWorkspace } from "../logic/capacity";
import { prepareRecruitingWorkspace } from "../logic/recruiting";
import { prepareWeeklyReviewFoundation } from "./v2WeeklyReview";

const contexts = (snapshot: DemoSnapshotV2) => {
  const capacity: WorkspaceQueryContext<"markets"> = {
    workspace: "markets", evaluation: { asOfAt: snapshot.currentAsOfAt, snapshotRevision: snapshot.revision, reportingTimeZone: REPORTING_TIME_ZONE },
    filters: { selectedMarket: "LAX", marketBasis: "demand-market", marketIds: ["LAX"], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [],
      programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: V2_MAIN_REQUEST_WINDOW },
  };
  const recruiting: WorkspaceQueryContext<"recruiting"> = {
    ...capacity, workspace: "recruiting", filters: { ...capacity.filters, marketBasis: "recruiting-market-at-entry", window: {
      startAt: "2026-01-01T00:00:00Z" as UtcTimestamp, endAt: "2026-02-01T00:00:00Z" as UtcTimestamp, boundary: "[start,end)",
    } },
  };
  return { capacity, recruiting };
};

describe("weekly review source composition", () => {
  it("retains scheduling and cohort populations with their exact evidence and no invented prior-week result", () => {
    const context = contexts(DEMO_SNAPSHOT_V2);
    const capacity = prepareMarketsWorkspace(DEMO_SNAPSHOT_V2, context.capacity);
    const recruiting = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, context.recruiting);
    const review = prepareWeeklyReviewFoundation(capacity, recruiting);
    expect(review.measures.find((item) => item.id === "schedule-coverage")).toMatchObject({ actual: 0.6, unit: "ratio", target: null, comparison: { status: "unavailable" } });
    const outcome = review.measures.find((item) => item.id === "onboarding-first-job")!;
    expect(outcome).toMatchObject({ actual: 9 / 22, target: null, comparison: { status: "unavailable" } });
    expect(outcome.evidence[0]).toBe(recruiting.evidence.find((item) => item.metric.id === "M08"));
    expect(outcome.evidence[0]?.denominatorMembers).toHaveLength(22);
    for (const constraint of review.constraints) expect(constraint.navigationTarget).toBe(constraint.evidence.navigationTarget);
    expect(review.measures.some((item) => item.id.startsWith("readiness-"))).toBe(false);
  });

  it("uses the saved readiness revision without recasting its deadline as a review date", () => {
    const snapshot = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "plan-saved"), context = contexts(snapshot);
    const capacity = prepareMarketsWorkspace(snapshot, context.capacity);
    const review = prepareWeeklyReviewFoundation(capacity, prepareRecruitingWorkspace(snapshot, context.recruiting));
    const goal = review.measures.find((item) => item.id.startsWith("readiness-"))!;
    expect(goal).toMatchObject({ actual: 0, target: { value: 2, records: [{ kind: "goal-revision", id: "goal-revision-lax-1" }] }, comparison: { status: "unavailable" } });
    expect(goal.observationLabel).toContain("goal deadline");
    expect(goal.evidence[0]).toBe(capacity.growthGoal!.evidence);
  });

  it("keeps an immature cohort unavailable instead of turning it into zero conversion", () => {
    const context = contexts(DEMO_SNAPSHOT_V2);
    const recruiting = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, { ...context.recruiting, filters: { ...context.recruiting.filters, window: {
      startAt: "2026-02-01T00:00:00Z" as UtcTimestamp, endAt: "2026-03-01T00:00:00Z" as UtcTimestamp, boundary: "[start,end)",
    } } });
    const review = prepareWeeklyReviewFoundation(prepareMarketsWorkspace(DEMO_SNAPSHOT_V2, context.capacity), recruiting);
    const outcome = review.measures.find((item) => item.id === "onboarding-first-job")!;
    expect(outcome.actual).toBeNull();
    expect(outcome.actualUnavailableReason).toBeTruthy();
    expect(outcome.evidence[0]?.computation.status).toBe("unavailable");
    expect(outcome.evidence[0]?.exclusions).toHaveLength(2);
  });

  it("rejects mixing domain revisions, evaluation times or selected markets", () => {
    const context = contexts(DEMO_SNAPSHOT_V2), capacity = prepareMarketsWorkspace(DEMO_SNAPSHOT_V2, context.capacity);
    const recruiting = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, context.recruiting);
    expect(() => prepareWeeklyReviewFoundation(capacity, { ...recruiting, evaluation: { ...recruiting.evaluation, snapshotRevision: 1 } })).toThrow("same market, as-of time and snapshot revision");
    expect(() => prepareWeeklyReviewFoundation(capacity, { ...recruiting, evaluation: { ...recruiting.evaluation, asOfAt: "2026-02-17T17:00:00Z" as UtcTimestamp } })).toThrow();
    expect(() => prepareWeeklyReviewFoundation(capacity, { ...recruiting, appliedFilters: { ...recruiting.appliedFilters, selectedMarket: "SFO" } })).toThrow();
  });
});
