import type { CommandRecord } from "./commands";
import type { UtcTimestamp } from "./common";
import type { AssignmentEvent, AvailabilityWindow, DemandRequest, JobOutcome } from "./demand";
import type { EvidenceBundle } from "./evidence";
import type { CommandId, ScenarioEventId } from "./ids";
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
import type {
  GoalRevision,
  ProcessVersion,
  Program,
  ProgramDecision,
  ProgramEnrollment,
  ProgramNote,
  Source,
  SourceSpend,
  WorkaroundExample,
} from "./programs";
import type { ManualMarketNote, Market, MetricDefinition } from "./referenceData";
import type { CoachingAction, TeamMember, TeamTarget, WorkItem, WorkQualityCheck } from "./work";

export interface DemoSnapshotV2 {
  readonly schemaVersion: 2;
  readonly seedVersion: string;
  readonly revision: number;
  readonly baseAsOfAt: UtcTimestamp;
  readonly currentAsOfAt: UtcTimestamp;
  readonly appliedCommandIds: readonly CommandId[];
  readonly appliedScenarioEventIds: readonly ScenarioEventId[];
  readonly markets: readonly Market[];
  readonly metricDefinitions: readonly MetricDefinition[];
  readonly evidenceSnapshots: readonly EvidenceBundle[];
  readonly manualMarketNotes: readonly ManualMarketNote[];
  readonly reporters: readonly Reporter[];
  readonly acquisitionCases: readonly AcquisitionCase[];
  readonly lifecycleEvents: readonly LifecycleEvent[];
  readonly credentialRecords: readonly CredentialRecord[];
  readonly capabilityVerifications: readonly CapabilityVerification[];
  readonly screeningReviews: readonly ScreeningReview[];
  readonly onboardingSteps: readonly OnboardingStep[];
  readonly readinessEvents: readonly ReadinessEvent[];
  readonly availabilityWindows: readonly AvailabilityWindow[];
  readonly demandRequests: readonly DemandRequest[];
  readonly assignmentEvents: readonly AssignmentEvent[];
  readonly jobOutcomes: readonly JobOutcome[];
  readonly teamMembers: readonly TeamMember[];
  readonly workItems: readonly WorkItem[];
  readonly teamTargets: readonly TeamTarget[];
  readonly workQualityChecks: readonly WorkQualityCheck[];
  readonly coachingActions: readonly CoachingAction[];
  readonly sources: readonly Source[];
  readonly sourceSpend: readonly SourceSpend[];
  readonly programs: readonly Program[];
  readonly programEnrollments: readonly ProgramEnrollment[];
  readonly programNotes: readonly ProgramNote[];
  readonly programDecisions: readonly ProgramDecision[];
  readonly goalRevisions: readonly GoalRevision[];
  readonly workaroundExamples: readonly WorkaroundExample[];
  readonly processVersions: readonly ProcessVersion[];
  readonly commandRecords: readonly CommandRecord[];
}
