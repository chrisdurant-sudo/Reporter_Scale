import type { UtcTimestamp } from "./common";

export type RecordKind =
  | "market"
  | "reporter"
  | "acquisition-case"
  | "lifecycle-event"
  | "credential-record"
  | "capability-verification"
  | "screening-review"
  | "onboarding-step"
  | "readiness-event"
  | "availability-window"
  | "demand-request"
  | "assignment-event"
  | "job-outcome"
  | "team-member"
  | "work-item"
  | "team-target"
  | "work-quality-check"
  | "coaching-action"
  | "source"
  | "source-spend"
  | "program"
  | "program-enrollment"
  | "program-note"
  | "program-decision"
  | "goal-revision"
  | "workaround-example"
  | "process-version"
  | "command-record"
  | "scenario-event";

export interface RecordPointer {
  readonly kind: RecordKind;
  readonly id: string;
}

export interface ResolvedRecordReference extends RecordPointer {
  readonly label: string;
  readonly occurredAt: UtcTimestamp | null;
  readonly joinPath: readonly RecordPointer[];
}
