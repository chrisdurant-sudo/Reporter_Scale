import type {
  AttendanceMode,
  CapabilityCode,
  DateWindow,
  MarketBasis,
  MarketId,
  MetricDefinitionRef,
  SelectedMarket,
  UtcTimestamp,
  WorkspaceId,
} from "./common";
import type {
  AcquisitionCaseId,
  EvidenceBundleId,
  JobOutcomeId,
  ProgramEnrollmentId,
  ProgramId,
  ReporterId,
  RequestId,
  SourceId,
  WorkItemId,
} from "./ids";
import type { RecordPointer, ResolvedRecordReference } from "./references";

export type EvidenceUnit =
  | "requests"
  | "people"
  | "jobs"
  | "tasks"
  | "events"
  | "ratio"
  | "currency-minor"
  | "days"
  | "hours";

export interface WorkspaceFilterPayload {
  /** True is an exact empty evidence selection; omitted/false retains normal scope filters. */
  readonly matchNone?: boolean;
  readonly selectedMarket: SelectedMarket;
  readonly marketBasis: MarketBasis;
  readonly marketIds: readonly MarketId[];
  readonly reporterIds: readonly ReporterId[];
  readonly acquisitionCaseIds: readonly AcquisitionCaseId[];
  readonly requestIds: readonly RequestId[];
  readonly workItemIds: readonly WorkItemId[];
  readonly programIds: readonly ProgramId[];
  readonly programEnrollmentIds: readonly ProgramEnrollmentId[];
  readonly sourceIds: readonly SourceId[];
  readonly jobOutcomeIds: readonly JobOutcomeId[];
  readonly capabilityCodes: readonly CapabilityCode[];
  readonly attendanceModes: readonly AttendanceMode[];
  readonly recordRefs: readonly RecordPointer[];
  readonly window: DateWindow | null;
}

export interface MetricScope {
  readonly workspace: WorkspaceId;
  readonly marketBasis: MarketBasis;
  readonly selectedMarket: SelectedMarket;
  readonly populationDescription: string;
}

export type EvidenceComputation =
  | {
      readonly status: "available";
      readonly value: number;
      readonly numerator: number | null;
      readonly denominator: number | null;
    }
  | {
      readonly status: "unavailable";
      readonly value: null;
      readonly numerator: null;
      readonly denominator: null;
      readonly reason: string;
    };

export interface EvidenceExclusion {
  readonly record: RecordPointer;
  readonly reasonCode: string;
  readonly reason: string;
}

export interface NavigationEvidenceContext {
  readonly asOfAt: UtcTimestamp;
  readonly snapshotRevision: number;
  readonly metric: MetricDefinitionRef;
}

export interface WorkspaceNavigationTarget {
  readonly workspace: WorkspaceId;
  readonly intent: "record-detail" | "work-list" | "evidence-list";
  readonly filters: WorkspaceFilterPayload;
  readonly evidenceContext: NavigationEvidenceContext;
}

export interface EvidenceBundle {
  readonly id: EvidenceBundleId;
  readonly metric: MetricDefinitionRef;
  readonly asOfAt: UtcTimestamp;
  readonly snapshotRevision: number;
  readonly unit: EvidenceUnit;
  readonly scope: MetricScope;
  readonly filters: WorkspaceFilterPayload;
  readonly reportingWindow: DateWindow | null;
  readonly computation: EvidenceComputation;
  readonly contributingRecords: readonly ResolvedRecordReference[];
  readonly numeratorMembers: readonly RecordPointer[];
  readonly denominatorMembers: readonly RecordPointer[];
  readonly exclusions: readonly EvidenceExclusion[];
  readonly unknownCount: number;
  readonly limitations: readonly string[];
  readonly explanation: string;
  readonly navigationTarget: WorkspaceNavigationTarget;
}
