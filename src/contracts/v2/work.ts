import type { DateWindow, DemoProvenance, MetricDefinitionRef, UtcTimestamp } from "./common";
import type {
  ActorId,
  CoachingActionId,
  CommandId,
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
  readonly actorId: ActorId;
  readonly fictionalName: string;
  readonly focusRole: string;
  readonly activeFrom: UtcTimestamp;
  readonly activeTo: UtcTimestamp | null;
  readonly provenance: DemoProvenance;
}

export type WorkItemKind = "source" | "screen" | "onboard" | "first-opportunity" | "re-engage" | "partner-task";
export type WorkItemStatus = "open" | "in-progress" | "blocked" | "completed" | "canceled";
export type WorkOwnershipDomain = "sourcing" | "screening" | "onboarding" | "market" | "program";

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

export type WorkPriority = "low" | "normal" | "high" | "urgent";

/** Values recorded by an edit. Omitted fields retain their prior value; null clears a due date/blocker. */
export interface WorkItemChanges {
  readonly title?: string;
  readonly dueAt?: UtcTimestamp | null;
  readonly priority?: WorkPriority;
  readonly blockerCode?: string | null;
}

export interface WorkItemEdit {
  readonly commandId: CommandId;
  readonly actorId: ActorId;
  readonly occurredAt: UtcTimestamp;
  readonly reason: string;
  readonly previous: WorkItemChanges;
  readonly changes: WorkItemChanges;
}

/** Notes belong to canonical work and use the command ID for replay-safe identity. */
export interface WorkItemNote {
  readonly commandId: CommandId;
  readonly actorId: ActorId;
  readonly occurredAt: UtcTimestamp;
  readonly text: string;
}

export interface WorkItem {
  readonly id: WorkItemId;
  /** User-facing label for work created through the Team board. Historical records use the kind-based fallback. */
  readonly title?: string;
  /** Optional for older V2 snapshots; absence is unspecified, never inferred urgency. */
  readonly priority?: WorkPriority;
  readonly editHistory?: readonly WorkItemEdit[];
  readonly notes?: readonly WorkItemNote[];
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
