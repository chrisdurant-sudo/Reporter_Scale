import type { UtcTimestamp } from "./common";
import type { AssignmentEvent, AvailabilityWindow, DemandRequest, JobOutcome } from "./demand";
import type { ScenarioCheckpointId, ScenarioEventId, ScenarioFeedId } from "./ids";
import type {
  AcquisitionCase,
  CapabilityVerification,
  CredentialRecord,
  LifecycleEvent,
  OnboardingStep,
  ReadinessEvent,
  Reporter,
  ScreeningReview,
} from "./people";
import type { GoalRevision, ProcessVersion, ProgramDecision, ProgramEnrollment } from "./programs";
import type { WorkItem } from "./work";

export type ScenarioAppendRecord =
  | { readonly kind: "reporter"; readonly record: Reporter }
  | { readonly kind: "acquisition-case"; readonly record: AcquisitionCase }
  | { readonly kind: "lifecycle-event"; readonly record: LifecycleEvent }
  | { readonly kind: "credential-record"; readonly record: CredentialRecord }
  | { readonly kind: "capability-verification"; readonly record: CapabilityVerification }
  | { readonly kind: "screening-review"; readonly record: ScreeningReview }
  | { readonly kind: "onboarding-step"; readonly record: OnboardingStep }
  | { readonly kind: "readiness-event"; readonly record: ReadinessEvent }
  | { readonly kind: "availability-window"; readonly record: AvailabilityWindow }
  | { readonly kind: "assignment-event"; readonly record: AssignmentEvent }
  | { readonly kind: "job-outcome"; readonly record: JobOutcome }
  | { readonly kind: "work-item"; readonly record: WorkItem }
  | { readonly kind: "program-enrollment"; readonly record: ProgramEnrollment }
  | { readonly kind: "program-decision"; readonly record: ProgramDecision }
  | { readonly kind: "goal-revision"; readonly record: GoalRevision }
  | { readonly kind: "process-version"; readonly record: ProcessVersion };

export type ScenarioOperation =
  | { readonly kind: "append-record"; readonly value: ScenarioAppendRecord }
  | { readonly kind: "replace-demand-request"; readonly record: DemandRequest }
  | { readonly kind: "replace-work-item"; readonly record: WorkItem };

export interface ScenarioFeedEvent {
  readonly id: ScenarioEventId;
  readonly sequence: number;
  readonly checkpointId: ScenarioCheckpointId;
  readonly recordedAt: UtcTimestamp;
  readonly applyAt: UtcTimestamp;
  readonly operation: ScenarioOperation;
}

export interface ScenarioFeedV2 {
  readonly id: ScenarioFeedId;
  readonly version: number;
  readonly baseSeedVersion: string;
  readonly events: readonly ScenarioFeedEvent[];
}

export interface ScenarioExpectedFact {
  readonly metricKey: string;
  readonly value: number;
  readonly unit: "requests" | "people" | "jobs" | "ratio";
}

export interface ScenarioCheckpointContract {
  readonly id: ScenarioCheckpointId;
  readonly label: string;
  readonly asOfAt: UtcTimestamp;
  readonly appliedEventIds: readonly ScenarioEventId[];
  readonly expectedFactsForTestsOnly: readonly ScenarioExpectedFact[];
}

export interface ScenarioContractV2 {
  readonly feed: ScenarioFeedV2;
  readonly checkpoints: readonly ScenarioCheckpointContract[];
}
