import type {
  AttendanceMode,
  CapabilityCode,
  DemoProvenance,
  IanaTimeZone,
  MarketId,
  ProceedingTypeCode,
  UtcTimestamp,
} from "./common";
import type {
  ActorId,
  AssignmentEventId,
  AvailabilityWindowId,
  JobOutcomeId,
  ReporterId,
  RequestId,
} from "./ids";

export type AvailabilityStatus = "available" | "unavailable" | "unknown";

export interface AvailabilityWindow {
  readonly id: AvailabilityWindowId;
  readonly reporterId: ReporterId;
  readonly startAt: UtcTimestamp;
  readonly endAt: UtcTimestamp;
  readonly status: AvailabilityStatus;
  readonly serviceMarketIds: readonly MarketId[];
  readonly attendanceModes: readonly AttendanceMode[];
  readonly recordedAt: UtcTimestamp;
  readonly confirmationExpiresAt: UtcTimestamp | null;
  readonly source: "reporter-confirmed" | "team-recorded" | "synthetic-seed" | "demo-simulation";
  readonly actorId: ActorId;
  readonly provenance: DemoProvenance;
}

export interface SampleCredentialRequirement {
  readonly requirementCode: string;
  readonly label: string;
  readonly jurisdictionScope: string | null;
  readonly samplePolicyNote: string;
}

export type DemandRequestStatus = "open" | "canceled" | "concluded";

export interface DemandRequest {
  readonly id: RequestId;
  readonly marketId: MarketId;
  readonly createdAt: UtcTimestamp;
  readonly recordedAt: UtcTimestamp;
  readonly startAt: UtcTimestamp;
  readonly endAt: UtcTimestamp;
  readonly timeZone: IanaTimeZone;
  readonly proceedingType: ProceedingTypeCode;
  readonly attendanceMode: AttendanceMode;
  readonly requiredCapabilityCodes: readonly CapabilityCode[];
  readonly sampleCredentialRequirements: readonly SampleCredentialRequirement[];
  readonly requirementsVersion: string;
  readonly status: DemandRequestStatus;
  readonly canceledAt: UtcTimestamp | null;
  readonly cancellationReason: string | null;
  readonly agreedDeliveryAt: UtcTimestamp | null;
  readonly provenance: DemoProvenance;
}

export type AssignmentState = "proposed" | "offered" | "accepted" | "declined" | "canceled";

export interface AssignmentEvent {
  readonly id: AssignmentEventId;
  readonly requestId: RequestId;
  readonly reporterId: ReporterId;
  readonly state: AssignmentState;
  readonly occurredAt: UtcTimestamp;
  readonly recordedAt: UtcTimestamp;
  readonly actorId: ActorId;
  readonly source: "synthetic-seed" | "demo-simulation" | "team-recorded";
  readonly reason: string;
  readonly provenance: DemoProvenance;
}

export type JobOutcomeState = "completed" | "canceled" | "not-completed";

export interface JobOutcome {
  readonly id: JobOutcomeId;
  readonly requestId: RequestId;
  readonly reporterId: ReporterId;
  readonly acceptedAssignmentEventId: AssignmentEventId;
  readonly outcome: JobOutcomeState;
  readonly startedAt: UtcTimestamp | null;
  readonly completedAt: UtcTimestamp | null;
  readonly deliveryAt: UtcTimestamp | null;
  readonly recordedAt: UtcTimestamp;
  readonly provenance: DemoProvenance;
}
