import type { CurrencyCode, DateWindow, MetricDefinitionRef, MetricEvaluationContext, SelectedMarket, UtcTimestamp } from "./common";
import type { EvidenceBundle, EvidenceUnit, WorkspaceNavigationTarget } from "./evidence";
import type { RecordPointer } from "./references";
import type { TeamMemberId } from "./ids";

/** Prepared domain facts only. Presentation formats these values; it never recalculates them. */
export interface WeeklyReviewMeasure {
  readonly id: string;
  readonly label: string;
  readonly metric: MetricDefinitionRef;
  readonly unit: EvidenceUnit;
  /** Null for nonmonetary or unavailable/ambiguous currency; never assume a currency from the UI locale. */
  readonly currency: CurrencyCode | null;
  readonly actual: number | null;
  readonly actualUnavailableReason: string | null;
  readonly scopeLabel: string;
  readonly observationLabel: string;
  readonly target: {
    readonly value: number;
    readonly label: string;
    readonly records: readonly RecordPointer[];
  } | null;
  readonly targetUnavailableReason: string | null;
  readonly comparison: {
    readonly status: "available";
    readonly currentWindow: DateWindow;
    readonly priorWindow: DateWindow;
    readonly current: number;
    readonly prior: number;
    readonly change: number;
    readonly label: string;
    readonly evidence: readonly EvidenceBundle[];
  } | {
    readonly status: "unavailable";
    readonly reason: string;
  };
  readonly evidence: readonly EvidenceBundle[];
  readonly limitations: readonly string[];
}

export interface WeeklyReviewConstraint {
  readonly id: string;
  readonly finding: string;
  readonly nextAction: string;
  readonly evidence: EvidenceBundle;
  readonly navigationTarget: WorkspaceNavigationTarget;
}

/** A source-backed action is distinct from a suggested next step without a recorded accountable owner. */
export interface WeeklyReviewAction {
  readonly id: string;
  readonly label: string;
  readonly source: RecordPointer;
  readonly owner: { readonly id: TeamMemberId; readonly name: string } | null;
  readonly reviewAt: UtcTimestamp | null;
  readonly reviewDateLabel: string;
  readonly dueAt: UtcTimestamp | null;
  readonly navigationTarget: WorkspaceNavigationTarget;
  readonly limitations: readonly string[];
}

export interface WeeklyOperatingReview {
  readonly evaluation: MetricEvaluationContext;
  readonly selectedMarket: SelectedMarket;
  readonly reportingWindow: DateWindow;
  readonly partialPeriod: boolean;
  readonly measures: readonly WeeklyReviewMeasure[];
  readonly constraints: readonly WeeklyReviewConstraint[];
  readonly actions: readonly WeeklyReviewAction[];
  readonly limitations: readonly string[];
}
