import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2, UtcTimestamp, WorkspaceQueryContext } from "../contracts/v2";
import { REPORTING_TIME_ZONE } from "../contracts/v2";
import { applyScenarioCheckpoint, DEMO_SNAPSHOT_V2, V2_MAIN_REQUEST_WINDOW } from "../data/v2";
import { prepareMarketsWorkspace } from "../logic/capacity";
import { prepareRecruitingWorkspace } from "../logic/recruiting";
import { prepareWeeklyOperatingReview, prepareWeeklyReviewFoundation, prepareWeeklyTeamReview } from "./v2WeeklyReview";

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


describe("weekly Team composition", () => {
  const teamContext = (selectedMarket: "ALL" | "LAX"): WorkspaceQueryContext<"team"> => ({
    ...contexts(DEMO_SNAPSHOT_V2).capacity, workspace: "team",
    filters: { ...contexts(DEMO_SNAPSHOT_V2).capacity.filters, selectedMarket, marketBasis: "all-markets", marketIds: selectedMarket === "ALL" ? [] : [selectedMarket],
      window: { startAt: "2026-02-09T08:00:00Z" as UtcTimestamp, endAt: "2026-02-16T08:00:00Z" as UtcTimestamp, boundary: "[start,end)" } },
  });
  const metric = DEMO_SNAPSHOT_V2.teamTargets[0]!.metric;

  it("retains member targets, completion-event comparisons and distinct exact evidence", () => {
    const review = prepareWeeklyTeamReview(DEMO_SNAPSHOT_V2, teamContext("ALL"), metric);
    expect(review.measures).toHaveLength(3);
    expect(review.partialPeriod).toBe(false);
    expect(review.measures.map((item) => item.target?.value)).toEqual([4, 1, 3]);
    const ids = review.measures.flatMap((item) => item.comparison.status === "available" ? item.comparison.evidence.map((evidence) => evidence.id) : []);
    expect(new Set(ids).size).toBe(6);
    for (const measure of review.measures) {
      expect(measure.comparison.status).toBe("available");
      if (measure.comparison.status !== "available") continue;
      expect(measure.actual).toBe(measure.comparison.current);
      expect(measure.comparison.change).toBe(measure.comparison.current - measure.comparison.prior);
      for (const evidence of measure.comparison.evidence) {
        expect(evidence.filters.workItemIds).toEqual(evidence.contributingRecords.map((record) => record.id));
        expect(evidence.navigationTarget.filters).toEqual(evidence.filters);
      }
    }
  });

  it("withholds whole-member targets for a market subset and preserves actual coaching review dates", () => {
    const review = prepareWeeklyTeamReview(DEMO_SNAPSHOT_V2, teamContext("LAX"), metric);
    expect(review.measures.every((measure) => measure.target === null && measure.targetUnavailableReason)).toBe(true);
    expect(review.actions).toHaveLength(0); // Recorded seed coaching belongs to DFW, ORD and ATL.
    const nationwide = prepareWeeklyTeamReview(DEMO_SNAPSHOT_V2, teamContext("ALL"), metric);
    expect(nationwide.actions).toHaveLength(3);
    for (const action of nationwide.actions) {
      const source = DEMO_SNAPSHOT_V2.coachingActions.find((item) => item.id === action.source.id)!;
      expect(action.reviewAt).toBe(source.reviewAt);
      expect(action.dueAt).toBe(source.dueAt);
      expect(action.owner?.id).toBe(source.teamMemberId);
      expect(action.navigationTarget.filters.recordRefs).toContainEqual(action.source);
    }
  });
});

describe("complete operating review", () => {
  const window = { startAt: "2026-02-09T08:00:00Z" as UtcTimestamp, endAt: "2026-02-16T08:00:00Z" as UtcTimestamp, boundary: "[start,end)" as const };
  const entryWindow = contexts(DEMO_SNAPSHOT_V2).recruiting.filters.window!;
  it("retains separate cohort metrics, compatible goals and the actual next review date", () => {
    const review = prepareWeeklyOperatingReview(DEMO_SNAPSHOT_V2, "ALL", window, entryWindow);
    const checklist = review.measures.filter((item) => item.metric.id === "M12");
    expect(checklist.map((item) => item.actual)).toEqual([6 / 20, 11 / 20]);
    expect(checklist.map((item) => item.target?.value ?? null)).toEqual([null, 0.5]);
    expect(checklist.every((item) => item.comparison.status === "unavailable")).toBe(true);
    const dfw = review.measures.find((item) => item.id.includes("program-dfw-broad-outreach"))!;
    expect(dfw).toMatchObject({ metric: { id: "M07" }, actual: 1 / 6, target: { value: 0.4 }, unit: "ratio" });
    const referral = review.measures.find((item) => item.id.includes("program-lax-realtime-referrals"))!;
    expect(referral).toMatchObject({ metric: { id: "M09" }, actual: null, unit: "currency-minor", currency: "USD", target: null });
    expect(referral.observationLabel).toContain("2 still observing");
    expect(referral.actualUnavailableReason).toBeTruthy();
    const action = review.actions.find((item) => item.source.id === "decision-checklist-expand")!;
    expect(action).toMatchObject({ reviewAt: "2026-03-16T17:00:00Z", reviewDateLabel: "Decision next review date", dueAt: null });
    expect(review.actions.some((item) => item.source.id === "decision-dfw-stop")).toBe(false);
    expect(review.partialPeriod).toBe(false);
  });

  it("preserves selected-market evidence and withholds nationwide/member targets from a subset", () => {
    const review = prepareWeeklyOperatingReview(DEMO_SNAPSHOT_V2, "LAX", window, entryWindow);
    expect(review.measures.filter((item) => item.metric.id === "M12").map((item) => item.actual)).toEqual([3 / 10, 6 / 10]);
    expect(review.measures.filter((item) => item.metric.id === "M12").every((item) => item.target === null && item.targetUnavailableReason)).toBe(true);
    expect(review.measures.some((item) => item.id.includes("dfw"))).toBe(false);
    for (const measure of review.measures) for (const evidence of measure.evidence) expect(evidence.filters.selectedMarket).toBe("LAX");
    for (const action of review.actions) expect(action.navigationTarget.filters.selectedMarket).toBe("LAX");
    expect(review.limitations[0]).toContain("Workspace-local");
  });
});
