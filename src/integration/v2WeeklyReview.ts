import type { DemoSnapshotV2, MetricDefinitionRef, TeamMemberId, WeeklyOperatingReview, WeeklyReviewMeasure, WorkspaceQueryContext } from "../contracts/v2";
import type { PreparedMarketsView } from "../logic/capacity";
import type { PreparedRecruitingView } from "../logic/recruiting";
import { prepareTeamCompletionComparison, prepareTeamView } from "../logic/team";

/** Compose existing domain facts; neither weekly labels nor UI selections redefine their populations. */
export function prepareWeeklyReviewFoundation(
  capacity: PreparedMarketsView,
  recruiting: PreparedRecruitingView,
): Pick<WeeklyOperatingReview, "measures" | "constraints"> {
  if (capacity.evaluation.asOfAt !== recruiting.evaluation.asOfAt
    || capacity.evaluation.snapshotRevision !== recruiting.evaluation.snapshotRevision
    || capacity.appliedFilters.selectedMarket !== recruiting.appliedFilters.selectedMarket) {
    throw new Error("Weekly review domains must share the same market, as-of time and snapshot revision.");
  }
  const measures: WeeklyReviewMeasure[] = [];
  const coverage = capacity.schedule?.confirmedCoverageEvidence;
  if (coverage) measures.push({
    id: "schedule-coverage", label: "Confirmed scheduling coverage", metric: coverage.metric, unit: coverage.unit, currency: null,
    actual: coverage.computation.value,
    actualUnavailableReason: coverage.computation.status === "unavailable" ? coverage.computation.reason : null,
    scopeLabel: coverage.scope.populationDescription, observationLabel: capacity.schedule!.rule,
    target: null, targetUnavailableReason: "No separate coverage-percentage target is recorded.",
    comparison: capacity.schedule!.previousPeriod,
    evidence: [coverage], limitations: coverage.limitations,
  });
  const goal = capacity.growthGoal;
  if (goal) measures.push({
    id: `readiness-${goal.goalRevisionId}`, label: "Saved readiness goal", metric: goal.metric, unit: goal.unit, currency: null,
    actual: goal.actual, actualUnavailableReason: null,
    scopeLabel: goal.evidence.scope.populationDescription,
    observationLabel: `Saved baseline ${goal.baselineAsOfAt}; goal deadline ${goal.deadline}.`,
    target: { value: goal.target, label: "Saved goal revision", records: [{ kind: "goal-revision", id: goal.goalRevisionId }] },
    targetUnavailableReason: null,
    comparison: { status: "unavailable", reason: "Goal progress since its saved baseline is not a comparable prior-week result." },
    evidence: [goal.evidence], limitations: goal.evidence.limitations,
  });
  const onboarding = recruiting.evidence.find((evidence) => evidence.metric.id === "M08");
  if (onboarding) measures.push({
    id: "onboarding-first-job", label: "First job within 14 days of onboarding", metric: onboarding.metric, unit: onboarding.unit, currency: null,
    actual: onboarding.computation.value,
    actualUnavailableReason: onboarding.computation.status === "unavailable" ? onboarding.computation.reason : null,
    scopeLabel: onboarding.scope.populationDescription, observationLabel: onboarding.explanation,
    target: null, targetUnavailableReason: "No onboarding-cohort target is recorded for this scope.",
    comparison: { status: "unavailable", reason: "The selected entry cohort is not a weekly flow; no matched prior cohort comparison was prepared." },
    evidence: [onboarding], limitations: onboarding.limitations,
  });
  return {
    measures,
    constraints: [
      ...(capacity.overview?.attention ?? []).flatMap((item) => item.evidence && item.navigationTarget ? [{
        id: `capacity-${item.id}`, finding: item.finding, nextAction: item.nextAction,
        evidence: item.evidence, navigationTarget: item.navigationTarget,
      }] : []),
      ...recruiting.attentionItems.map((item) => ({
        id: `recruiting-${item.acquisitionCaseId}-${item.actionRecord.id}`, finding: item.finding,
        nextAction: item.nextAction, evidence: item.evidence, navigationTarget: item.navigationTarget,
      })),
    ],
  };
}

/** Team owns completion attribution, period math and target eligibility; integration only presents them. */
export function prepareWeeklyTeamReview(
  snapshot: DemoSnapshotV2,
  context: WorkspaceQueryContext<"team">,
  metric: MetricDefinitionRef,
): Pick<WeeklyOperatingReview, "measures" | "actions" | "partialPeriod" | "limitations"> {
  const team = prepareTeamView(snapshot, context, metric);
  const measures = team.members.map((member): WeeklyReviewMeasure => {
    const comparison = prepareTeamCompletionComparison(snapshot, context, metric, { memberId: member.id as TeamMemberId });
    return {
      id: `team-completions-${member.id}`, label: `${member.name} · completed work`, metric, unit: "tasks", currency: null,
      actual: comparison?.current.count ?? null,
      actualUnavailableReason: comparison ? null : "A valid reporting window is required.",
      scopeLabel: comparison?.scope ?? "The selected Team scope.",
      observationLabel: "Distinct first completion events in the stated reporting window, credited to the recorded completion actor.",
      target: member.completed.target !== null && member.completed.targetId ? {
        value: member.completed.target, label: member.completed.note,
        records: [{ kind: "team-target", id: member.completed.targetId }],
      } : null,
      targetUnavailableReason: member.completed.target === null ? member.completed.note : null,
      comparison: comparison ? {
        status: "available", currentWindow: comparison.current.window, priorWindow: comparison.prior.window,
        current: comparison.current.count, prior: comparison.prior.count, change: comparison.delta,
        label: comparison.partialPeriod ? "Provisional change; the current period is incomplete." : "Change from the preceding equal-length reporting window.",
        evidence: [comparison.current.evidence, comparison.prior.evidence],
      } : { status: "unavailable", reason: "A valid reporting window is required." },
      evidence: comparison ? [comparison.current.evidence] : [],
      limitations: [...team.scopeNotes, ...(comparison?.limitation ? [comparison.limitation] : [])],
    };
  });
  return {
    measures,
    actions: team.members.flatMap((member) => member.coachingDetails.map((detail) => ({
      id: `coaching-${detail.action.id}`, label: detail.action.nextAction,
      source: { kind: "coaching-action" as const, id: detail.action.id },
      owner: { id: detail.action.teamMemberId, name: member.name },
      reviewAt: detail.action.reviewAt, reviewDateLabel: "Recorded coaching review date", dueAt: detail.action.dueAt,
      navigationTarget: detail.navigationTarget,
      limitations: ["The accountable member is the coaching subject; the original author remains on the source record.", ...(detail.limitation ? [detail.limitation] : [])],
    }))),
    partialPeriod: team.completionComparison?.partialPeriod ?? true,
    limitations: team.limitations,
  };
}
