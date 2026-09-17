import type {
  CreateProcessDraftInput,
  MarketPlanInput,
  MarketPlanPreview,
  OutreachPreview,
  RecordDecisionInput,
  SaveCoachingInput,
  SaveScreeningInput,
  UpdateFollowUpInput,
  UpdateProcessDraftInput,
  ActionResult,
} from "./commands";
import type {
  ImprovementDecisionKind,
  LifecycleStage,
  MarketAssumptions,
  MarketId,
  ProcessDraftStep,
  ScreeningCheckStatus,
  SelectedMarket,
} from "./models";

export type ViewStatus = "loading" | "ready" | "empty" | "error";
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface SupportingRecordView {
  id: string;
  label: string;
  occurredAt: string;
}

export interface MarketComparisonRowView {
  marketId: MarketId;
  code: MarketId;
  name: string;
  periodLabel: string;
  firstJobsCompleted: number;
  goal: number;
  remaining: number;
  progressPercent: number;
  observedIssue: string;
  nextAction: string;
  supportingRecords: SupportingRecordView[];
}

export interface MarketPlanView {
  marketId: MarketId;
  marketName: string;
  goal: number;
  assumptions: MarketAssumptions;
  planningStartAt: string;
  planningEndAt: string;
  actualFirstJobsCompleted: number;
  populationNote: string;
  leadTimeNote: string;
}

export interface MarketsViewModel {
  status: ViewStatus;
  selectedMarket: SelectedMarket;
  rows: MarketComparisonRowView[];
  selectedPlan: MarketPlanView | null;
  statusMessage: string;
}

export interface MarketsActions {
  onSelectMarket(market: SelectedMarket): void;
  onPreviewPlan(input: MarketPlanInput): ActionResult<MarketPlanPreview>;
  onSavePlan(input: MarketPlanInput): Promise<ActionResult>;
  onCancelPlan(): void;
  onOpenReporterWork(marketId: MarketId): void;
}

export interface MarketsScreenProps {
  view: MarketsViewModel;
  actions: MarketsActions;
}

export interface StageCountView {
  stage: LifecycleStage;
  label: string;
  count: number;
  note: string;
}

export interface ReporterRowView {
  id: string;
  name: string;
  recruitingMarketId: MarketId;
  marketLabel: string;
  stage: LifecycleStage;
  stageLabel: string;
  waitDays: number;
  blocker: string;
  nextStep: string;
  assignedTo: string;
  dueAt: string;
  tone: StatusTone;
}

export interface ScreeningCheckView {
  id: string;
  label: string;
  required: boolean;
  status: ScreeningCheckStatus;
  note: string;
}

export interface ReporterHistoryView {
  id: string;
  occurredAt: string;
  label: string;
  reason: string;
  author: string;
}

export interface ReporterDetailView {
  id: string;
  name: string;
  marketLabel: string;
  serviceMarketsLabel: string;
  foundThrough: string;
  preferences: { label: string; value: string }[];
  blocker: string;
  stageLabel: string;
  screeningReviewId: string | null;
  screeningOutcome: string;
  screeningReason: string;
  unresolvedInformation: string[];
  checks: ScreeningCheckView[];
  followUpId: string | null;
  nextStep: string;
  assignedTeamMemberId: string;
  dueAt: string;
  history: ReporterHistoryView[];
}

export interface TeamMemberOptionView {
  id: string;
  name: string;
}

export interface TeamWorkloadView {
  teamMemberId: string;
  name: string;
  openFollowUps: number;
  overdueFollowUps: number;
  workloadNote: string;
  coachingNotes: { id: string; note: string; nextAction: string; dueAt: string }[];
}

export interface ReportersViewModel {
  status: ViewStatus;
  selectedMarket: SelectedMarket;
  marketLabel: string;
  asOfLabel: string;
  populationNote: string;
  stages: StageCountView[];
  reporters: ReporterRowView[];
  reporterDetails: ReporterDetailView[];
  teamMemberOptions: TeamMemberOptionView[];
  teamWorkload: TeamWorkloadView[];
  statusMessage: string;
}

export interface ReportersActions {
  onSaveScreening(input: SaveScreeningInput): Promise<ActionResult>;
  onUpdateFollowUp(input: UpdateFollowUpInput): Promise<ActionResult>;
  onPreviewOutreach(reporterId: string): ActionResult<OutreachPreview>;
  onSaveCoaching(input: SaveCoachingInput): Promise<ActionResult>;
}

export interface ReportersScreenProps {
  view: ReportersViewModel;
  actions: ReportersActions;
  initialReporterId?: string | null;
}

export interface ImprovementResultView {
  label: string;
  reporterCount: number;
  completedCount: number;
  rateLabel: string;
  observationComplete: boolean;
  note: string;
}

export interface ProcessDraftView {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  trigger: string;
  steps: ProcessDraftStep[];
  updatedAt: string;
}

export interface ImprovementCardView {
  id: string;
  title: string;
  marketIds: MarketId[];
  marketLabel: string;
  changeTypeLabel: string;
  hypothesis: string;
  changeSummary: string;
  ownerId: string;
  ownerName: string;
  partnerDeliverable: string;
  reviewAt: string;
  observationWindowLabel: string;
  results: ImprovementResultView[];
  limitations: string[];
  currentDecision: ImprovementDecisionKind | null;
  decisionRationale: string;
  canSaveAsProcess: boolean;
  processDraft: ProcessDraftView | null;
}

export interface WeeklyReviewView {
  windowLabel: string;
  summary: string;
  evidence: { label: string; value: string; sourceRecordIds: string[] }[];
  nextActions: string[];
}

export interface ImprovementsViewModel {
  status: ViewStatus;
  selectedMarket: SelectedMarket;
  improvements: ImprovementCardView[];
  teamMemberOptions: TeamMemberOptionView[];
  weeklyReview: WeeklyReviewView;
  statusMessage: string;
}

export interface ImprovementsActions {
  onRecordDecision(input: RecordDecisionInput): Promise<ActionResult>;
  onCreateProcessDraft(input: CreateProcessDraftInput): Promise<ActionResult>;
  onUpdateProcessDraft(input: UpdateProcessDraftInput): Promise<ActionResult>;
}

export interface ImprovementsScreenProps {
  view: ImprovementsViewModel;
  actions: ImprovementsActions;
}
