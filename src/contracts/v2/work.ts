import type { DateWindow, DemoProvenance, MetricDefinitionRef, UtcTimestamp } from "./common";
import type {
  ActorId,
  CoachingActionId,
  ProgramId,
  RequestId,
  TeamMemberId,
  TeamTargetId,
  WorkItemId,
  WorkQualityCheckId,
} from "./ids";
import type { RecordPointer } from "./references";

export interface TeamMember {
  readonly id: TeamMemberId;
  readonly fictionalName: string;
  readonly focusRole: string;
  readonly activeFrom: UtcTimestamp;
  readonly activeTo: UtcTimestamp | null;
  readonly provenance: DemoProvenance;
}

export type WorkItemKind = "source" | "screen" | "onboard" | "first-opportunity" | "re-engage" | "partner-task";
export type WorkItemStatus = "open" | "in-progress" | "blocked" | "completed" | "canceled";

export interface WorkItemOwnerChange {
  readonly ownerId: TeamMemberId | null;
  readonly occurredAt: UtcTimestamp;
  readonly actorId: ActorId;
  readonly reason: string;
}

export interface WorkItemStatusChange {
  readonly status: WorkItemStatus;
  readonly occurredAt: UtcTimestamp;
  readonly actorId: ActorId;
  readonly reason: string;
}

export interface WorkItem {
  readonly id: WorkItemId;
  readonly kind: WorkItemKind;
  readonly primaryEntityRef: RecordPointer;
  readonly relatedRequestIds: readonly RequestId[];
  readonly programId: ProgramId | null;
  readonly createdAt: UtcTimestamp;
  readonly ownerHistory: readonly WorkItemOwnerChange[];
  readonly dueAt: UtcTimestamp | null;
  readonly statusHistory: readonly WorkItemStatusChange[];
  readonly blockerCode: string | null;
  readonly completionEvidenceRefs: readonly RecordPointer[];
  readonly provenance: DemoProvenance;
}

export interface TeamTarget {
  readonly id: TeamTargetId;
  readonly teamMemberId: TeamMemberId | null;
  readonly role: string | null;
  readonly metric: MetricDefinitionRef;
  readonly target: number;
  readonly reportingWindow: DateWindow;
  readonly createdAt: UtcTimestamp;
  readonly rationale: string;
  readonly provenance: DemoProvenance;
}

export interface WorkQualityCheckResult {
  readonly checkCode: string;
  readonly passed: boolean;
  readonly reason: string;
}

export interface WorkQualityCheck {
  readonly id: WorkQualityCheckId;
  readonly workItemId: WorkItemId;
  readonly checkedBy: TeamMemberId;
  readonly checkedAt: UtcTimestamp;
  readonly requiredCheckResults: readonly WorkQualityCheckResult[];
  readonly outcome: "passed" | "needs-follow-up";
  readonly provenance: DemoProvenance;
}

export interface CoachingAction {
  readonly id: CoachingActionId;
  readonly teamMemberId: TeamMemberId;
  readonly linkedWorkItemIds: readonly WorkItemId[];
  readonly observedIssueOrStrength: string;
  readonly expectedPractice: string;
  readonly nextAction: string;
  readonly dueAt: UtcTimestamp;
  readonly reviewAt: UtcTimestamp;
  readonly outcomeNote: string | null;
  readonly authorId: ActorId;
  readonly createdAt: UtcTimestamp;
  readonly updatedAt: UtcTimestamp;
  readonly provenance: DemoProvenance;
}
