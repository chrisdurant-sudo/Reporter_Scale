import type {
  AttendanceMode,
  CapabilityCode,
  DemoProvenance,
  MarketId,
  ProceedingTypeCode,
  UtcTimestamp,
} from "./common";
import type {
  AcquisitionCaseId,
  ActorId,
  CapabilityVerificationId,
  CredentialRecordId,
  LifecycleEventId,
  OnboardingStepId,
  ProgramId,
  ReadinessEventId,
  ReporterId,
  ScreeningReviewId,
  SourceId,
  TeamMemberId,
  WorkItemId,
} from "./ids";
import type { RecordPointer } from "./references";

export type ServiceMarketPreferenceStatus = "serves" | "does-not-serve" | "needs-confirmation";

export interface ServiceMarketPreference {
  readonly marketId: MarketId;
  readonly status: ServiceMarketPreferenceStatus;
}

export interface ReporterPreferences {
  readonly attendanceModes: readonly AttendanceMode[];
  readonly supportedProceedingTypes: readonly ProceedingTypeCode[];
  readonly supportedCapabilityCodes: readonly CapabilityCode[];
  readonly serviceMarkets: readonly ServiceMarketPreference[];
  readonly notes: string;
}

export interface Reporter {
  readonly id: ReporterId;
  readonly fictionalName: string;
  readonly recruitingMarketId: MarketId;
  readonly serviceMarketIds: readonly MarketId[];
  readonly createdAt: UtcTimestamp;
  readonly recordedAt: UtcTimestamp;
  readonly preferences: ReporterPreferences;
  readonly provenance: DemoProvenance;
}

export interface AcquisitionCase {
  readonly id: AcquisitionCaseId;
  readonly reporterId: ReporterId;
  readonly ownerMarketId: MarketId;
  readonly primarySourceId: SourceId | null;
  readonly openedAt: UtcTimestamp;
  readonly recordedAt: UtcTimestamp;
  readonly purpose: "first-time";
  readonly originProgramId: ProgramId | null;
  readonly provenance: DemoProvenance;
}

export type LifecycleEventType =
  | "sourced"
  | "contacted"
  | "responded"
  | "screening-started"
  | "qualified"
  | "onboarding-started"
  | "ready"
  | "paused"
  | "resumed"
  | "closed";

export interface LifecycleEvent {
  readonly id: LifecycleEventId;
  readonly acquisitionCaseId: AcquisitionCaseId;
  readonly reporterId: ReporterId;
  readonly eventType: LifecycleEventType;
  readonly occurredAt: UtcTimestamp;
  readonly recordedAt: UtcTimestamp;
  readonly actorId: ActorId;
  readonly reasonCode: string;
  readonly reasonText: string;
  readonly marketAtEntry: MarketId;
  readonly linkedWorkItemId: WorkItemId | null;
  readonly provenance: DemoProvenance;
}

export type VerificationStatus = "unreviewed" | "needs-information" | "verified" | "not-demonstrated";

export interface CredentialRecord {
  readonly id: CredentialRecordId;
  readonly reporterId: ReporterId;
  readonly label: string;
  readonly issuerLabel: string;
  readonly jurisdictionScope: string | null;
  readonly verificationStatus: VerificationStatus;
  readonly verifiedAt: UtcTimestamp | null;
  readonly validFrom: UtcTimestamp | null;
  readonly validUntil: UtcTimestamp | null;
  readonly recordedAt: UtcTimestamp;
  readonly evidenceRef: RecordPointer;
  readonly provenance: DemoProvenance;
}

export interface CapabilityVerification {
  readonly id: CapabilityVerificationId;
  readonly reporterId: ReporterId;
  readonly capabilityCode: CapabilityCode;
  readonly status: VerificationStatus;
  readonly recordedAt: UtcTimestamp;
  readonly reviewerId: TeamMemberId;
  readonly evidenceRef: RecordPointer;
  readonly provenance: DemoProvenance;
}

export interface ScreeningCheckResult {
  readonly checkCode: string;
  readonly required: boolean;
  readonly status: "complete" | "needs-information" | "not-reviewed";
  readonly evidenceRef: RecordPointer | null;
  readonly note: string;
}

export interface ScreeningReview {
  readonly id: ScreeningReviewId;
  readonly reporterId: ReporterId;
  readonly acquisitionCaseId: AcquisitionCaseId;
  readonly checks: readonly ScreeningCheckResult[];
  readonly outcome: "pending" | "verified" | "needs-information" | "closed";
  readonly unresolvedInformation: readonly string[];
  readonly reviewerId: TeamMemberId;
  readonly reviewedAt: UtcTimestamp;
  readonly recordedAt: UtcTimestamp;
  readonly reason: string;
  readonly provenance: DemoProvenance;
}

export type OnboardingStepState = "not-started" | "in-progress" | "blocked" | "completed" | "waived";

export interface OnboardingStep {
  readonly id: OnboardingStepId;
  readonly acquisitionCaseId: AcquisitionCaseId;
  readonly stepDefinitionId: string;
  readonly required: boolean;
  readonly state: OnboardingStepState;
  readonly assignedTo: TeamMemberId | null;
  readonly dueAt: UtcTimestamp | null;
  readonly completedAt: UtcTimestamp | null;
  readonly completedBy: TeamMemberId | null;
  readonly evidenceRef: RecordPointer | null;
  readonly blockerCode: string | null;
  readonly recordedAt: UtcTimestamp;
  readonly provenance: DemoProvenance;
}

export interface ReadinessEvent {
  readonly id: ReadinessEventId;
  readonly acquisitionCaseId: AcquisitionCaseId;
  readonly reporterId: ReporterId;
  readonly occurredAt: UtcTimestamp;
  readonly recordedAt: UtcTimestamp;
  readonly actorId: ActorId;
  readonly checklistVersion: string;
  readonly checkedStepIds: readonly OnboardingStepId[];
  readonly capabilityVerificationIds: readonly CapabilityVerificationId[];
  readonly provenance: DemoProvenance;
}
