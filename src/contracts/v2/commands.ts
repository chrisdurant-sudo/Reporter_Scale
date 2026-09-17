import type { UtcTimestamp } from "./common";
import type {
  ActorId,
  CoachingActionId,
  CommandId,
  TeamMemberId,
  TeamTargetId,
  WorkItemId,
} from "./ids";
import type { RecordPointer } from "./references";
import type { CoachingAction, TeamTarget, WorkQualityCheck } from "./work";

export type V2CommandType =
  | "goal.save-revision"
  | "work.create"
  | "work.assign"
  | "work.transition"
  | "team.target.save-revision"
  | "team.quality.record"
  | "team.coaching.record"
  | "team.coaching.review"
  | "team.practice.share"
  | "recruiting.record-lifecycle"
  | "recruiting.record-screening"
  | "recruiting.complete-onboarding-step"
  | "recruiting.record-readiness"
  | "network.record-availability"
  | "capacity.record-assignment"
  | "capacity.record-job-outcome"
  | "programs.enroll"
  | "programs.record-decision"
  | "programs.save-process-version"
  | "scenario.apply-event";

export interface V2CommandContext {
  readonly commandId: CommandId;
  readonly expectedRevision: number;
  readonly actorId: ActorId;
  readonly occurredAt: UtcTimestamp;
}

export interface V2CommandEnvelope<TType extends V2CommandType, TPayload> {
  readonly type: TType;
  readonly context: V2CommandContext;
  readonly payload: TPayload;
}

export interface WorkAssignPayload {
  readonly workItemId: WorkItemId;
  readonly ownerId: TeamMemberId | null;
  readonly reason: string;
}

export interface TeamTargetSaveRevisionPayload {
  readonly target: TeamTarget;
  readonly supersedesTargetId: TeamTargetId | null;
}

export interface TeamQualityRecordPayload {
  readonly qualityCheck: WorkQualityCheck;
}

export interface TeamCoachingRecordPayload {
  readonly coachingAction: CoachingAction;
}

export interface TeamCoachingReviewPayload {
  readonly coachingActionId: CoachingActionId;
  readonly reviewedAt: UtcTimestamp;
  readonly outcomeNote: string;
}

export interface TeamPracticeSharePayload {
  readonly coachingAction: CoachingAction;
}

export type TeamCommandEnvelope =
  | V2CommandEnvelope<"work.assign", WorkAssignPayload>
  | V2CommandEnvelope<"team.target.save-revision", TeamTargetSaveRevisionPayload>
  | V2CommandEnvelope<"team.quality.record", TeamQualityRecordPayload>
  | V2CommandEnvelope<"team.coaching.record", TeamCoachingRecordPayload>
  | V2CommandEnvelope<"team.coaching.review", TeamCoachingReviewPayload>
  | V2CommandEnvelope<"team.practice.share", TeamPracticeSharePayload>;

export interface V2CommandError {
  readonly code: "invalid-command" | "stale-revision" | "validation-failed" | "invariant-failed";
  readonly message: string;
  readonly field: string | null;
  readonly relatedRecords: readonly RecordPointer[];
}

export type V2CommandResult<TValue> =
  | {
      readonly ok: true;
      readonly value: TValue;
      readonly commandId: CommandId;
      readonly revision: number;
      readonly changed: boolean;
      readonly replayed: boolean;
      readonly affectedRecords: readonly RecordPointer[];
      readonly message: string;
    }
  | {
      readonly ok: false;
      readonly commandId: CommandId;
      readonly revision: number;
      readonly errors: readonly V2CommandError[];
      readonly message: string;
    };

export type CommandGateDecision =
  | { readonly kind: "apply" }
  | { readonly kind: "replay"; readonly appliedRevision: number }
  | { readonly kind: "stale"; readonly actualRevision: number };

export interface CommandRecord {
  readonly id: CommandId;
  readonly expectedRevision: number;
  readonly appliedRevision: number;
  readonly actorId: ActorId;
  readonly occurredAt: UtcTimestamp;
  readonly commandType: V2CommandType;
  readonly affectedRecords: readonly RecordPointer[];
  readonly result: "applied" | "replayed" | "rejected";
}
