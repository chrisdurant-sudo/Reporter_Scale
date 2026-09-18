import type {
  CapabilityCode,
  CurrencyCode,
  DateWindow,
  DemoProvenance,
  DefinitionVersion,
  MarketId,
  MetricDefinitionRef,
  MinorCurrencyAmount,
  UtcTimestamp,
} from "./common";
import type {
  AcquisitionCaseId,
  ActorId,
  EvidenceBundleId,
  GoalId,
  GoalRevisionId,
  ProcessVersionId,
  ProgramDecisionId,
  ProgramEnrollmentId,
  ProgramId,
  ProgramNoteId,
  ReporterId,
  SourceId,
  SourceSpendId,
  TeamMemberId,
  WorkaroundExampleId,
} from "./ids";
import type { RecordPointer } from "./references";

export type SourceKind = "referral" | "outreach" | "event" | "other";

export interface Source {
  readonly id: SourceId;
  readonly label: string;
  readonly kind: SourceKind;
  readonly description: string;
  readonly provenance: DemoProvenance;
}

export interface SourceSpend {
  readonly id: SourceSpendId;
  readonly sourceId: SourceId;
  readonly programId: ProgramId | null;
  readonly cohortRef: string | null;
  readonly attributableWindow: DateWindow | null;
  readonly amountMinor: MinorCurrencyAmount;
  readonly currency: CurrencyCode;
  readonly occurredAt: UtcTimestamp;
  readonly allocationNote: string;
  readonly provenance: DemoProvenance;
}

export type ProgramType = "source" | "tool" | "incentive" | "workflow" | "re-engagement";
export type ProgramStage = "idea" | "trying" | "reviewing" | "rolling-out" | "closed";

export interface ProgramMeasurementPlan {
  readonly metric: MetricDefinitionRef;
  readonly entryWindow: DateWindow;
  readonly followUpDays: number;
  readonly eligibilityRule: string;
  readonly attributionRule: string;
}

export interface Program {
  readonly id: ProgramId;
  readonly title: string;
  readonly marketIds: readonly MarketId[];
  readonly linkedNeedRefs: readonly RecordPointer[];
  readonly type: ProgramType;
  readonly stage: ProgramStage;
  readonly ownerId: TeamMemberId;
  readonly hypothesis: string;
  readonly changeSummary: string;
  readonly primaryMetric: MetricDefinitionRef;
  readonly targetRef: GoalId | null;
  readonly startAt: UtcTimestamp;
  readonly reviewAt: UtcTimestamp;
  readonly measurementPlan: ProgramMeasurementPlan;
  readonly originWorkaroundRef: WorkaroundExampleId | null;
  readonly limitations: readonly string[];
  readonly provenance: DemoProvenance;
}

export interface ProgramEnrollment {
  readonly id: ProgramEnrollmentId;
  readonly programId: ProgramId;
  readonly groupId: string;
  readonly reporterId: ReporterId;
  readonly acquisitionCaseId: AcquisitionCaseId | null;
  readonly enteredAt: UtcTimestamp;
  readonly eligibilityEvidenceRefs: readonly RecordPointer[];
  readonly marketAtEntry: MarketId;
  readonly sourceAtEntry: SourceId | null;
  readonly processVersionId: ProcessVersionId | null;
  readonly provenance: DemoProvenance;
}

export interface ProgramNote {
  readonly id: ProgramNoteId;
  readonly programId: ProgramId;
  readonly authorId: ActorId;
  /** Historical notes omit the kind and are treated as general notes. */
  readonly kind?: "note" | "next-step";
  readonly text: string;
  readonly createdAt: UtcTimestamp;
  readonly provenance: DemoProvenance;
}

export type ProgramDecisionKind = "continue" | "change" | "stop" | "expand";

export interface ProgramDecision {
  readonly id: ProgramDecisionId;
  readonly programId: ProgramId;
  readonly decision: ProgramDecisionKind;
  readonly rationale: string;
  readonly decidedBy: ActorId;
  readonly decidedAt: UtcTimestamp;
  readonly evidenceSnapshotId: EvidenceBundleId;
  readonly nextReviewAt: UtcTimestamp | null;
  readonly provenance: DemoProvenance;
}

export interface GoalScope {
  readonly marketIds: readonly MarketId[];
  readonly programIds: readonly ProgramId[];
  readonly acquisitionCasePurpose: "first-time" | null;
  readonly requiredCapabilityCodes: readonly CapabilityCode[];
}

export interface GoalRevision {
  readonly id: GoalRevisionId;
  readonly goalId: GoalId;
  readonly version: number;
  readonly metric: MetricDefinitionRef;
  readonly scope: GoalScope;
  readonly baselineAsOfAt: UtcTimestamp;
  readonly baselineEvidenceSnapshotId: EvidenceBundleId;
  readonly target: number;
  readonly deadline: UtcTimestamp;
  readonly ownerId: TeamMemberId;
  readonly savedAt: UtcTimestamp;
  readonly changeReason: string;
  readonly supersedesRevisionId: GoalRevisionId | null;
  readonly provenance: DemoProvenance;
}

export interface WorkaroundColumnDefinition {
  readonly key: string;
  readonly label: string;
}

export interface WorkaroundRow {
  readonly rowId: string;
  readonly cells: readonly { readonly columnKey: string; readonly value: string }[];
}

export interface WorkaroundExample {
  readonly id: WorkaroundExampleId;
  readonly kind: "synthetic-spreadsheet";
  readonly purpose: string;
  readonly columnDefinitions: readonly WorkaroundColumnDefinition[];
  readonly rows: readonly WorkaroundRow[];
  readonly relatedProblemRefs: readonly RecordPointer[];
  readonly provenance: DemoProvenance;
}

export type ProcessVersionStatus = "draft" | "review-ready" | "approved-for-limited-pilot";

export interface ProcessStep {
  readonly id: string;
  readonly order: number;
  readonly instruction: string;
  readonly evidenceRequirement: string;
}

export interface ProcessApproval {
  readonly status: ProcessVersionStatus;
  readonly actorId: ActorId;
  readonly occurredAt: UtcTimestamp;
  readonly rationale: string;
}

export interface ProcessVersion {
  readonly id: ProcessVersionId;
  readonly programId: ProgramId;
  readonly version: number;
  readonly status: ProcessVersionStatus;
  readonly trigger: string;
  readonly ownerId: TeamMemberId;
  readonly requiredSteps: readonly ProcessStep[];
  readonly exceptions: readonly string[];
  readonly approvalHistory: readonly ProcessApproval[];
  readonly evidenceSnapshotId: EvidenceBundleId;
  readonly nextReviewAt: UtcTimestamp;
  readonly definitionVersion: DefinitionVersion;
  readonly provenance: DemoProvenance;
}
