import type { WeeklyOperatingReview, WeeklyReviewMeasure } from "../contracts/v2";
import type { PreparedMarketsView } from "../logic/capacity";
import type { PreparedRecruitingView } from "../logic/recruiting";

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
