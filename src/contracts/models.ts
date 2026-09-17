export const MARKET_IDS = ["LAX", "SFO", "DFW", "ORD", "ATL"] as const;

export type MarketId = (typeof MARKET_IDS)[number];
export type SelectedMarket = "ALL" | MarketId;
export type AppTab = "markets" | "reporters" | "improvements";

export interface DateWindow {
  startAt: string;
  endAt: string;
}

export interface MarketAssumptions {
  screeningPassRate: number;
  onboardingStartRate: number;
  firstJobWithin14DaysRate: number;
  leadTimeDays: number;
}

export interface Market {
  id: MarketId;
  code: MarketId;
  name: string;
  planningWindow: DateWindow;
  firstJobGoal: number;
  assumptions: MarketAssumptions;
  observedIssue: string;
  nextAction: string;
  provenance: "synthetic-demo";
}

export interface ReporterPreferences {
  availability: string;
  travel: string;
  proceedingTypes: string[];
  notes: string;
}

export interface Reporter {
  id: string;
  fictionalName: string;
  recruitingMarketId: MarketId;
  serviceMarketIds: MarketId[];
  foundThrough: string;
  preferences: ReporterPreferences;
  createdAt: string;
  provenance: "synthetic-demo";
}

export type LifecycleStage =
  | "prospect"
  | "screening"
  | "onboarding"
  | "ready-for-first-job"
  | "first-job-completed"
  | "paused";

export interface LifecycleEvent {
  id: string;
  reporterId: string;
  occurredAt: string;
  stage: LifecycleStage;
  reason: string;
  author: string;
  recruitingMarketIdAtEntry: MarketId;
}

export type ScreeningCheckStatus = "complete" | "needs-information" | "not-reviewed";

export interface ScreeningCheck {
  id: string;
  label: string;
  required: boolean;
  status: ScreeningCheckStatus;
  note: string;
}

export type ScreeningOutcome = "pending" | "verified" | "needs-information" | "closed";

export interface ScreeningReview {
  id: string;
  reporterId: string;
  checks: ScreeningCheck[];
  unresolvedInformation: string[];
  reason: string;
  outcome: ScreeningOutcome;
  reviewerId: string;
  reviewedAt: string;
}

export type JobStatus = "scheduled" | "completed" | "canceled";

export interface Job {
  id: string;
  reporterId: string;
  marketId: MarketId;
  status: JobStatus;
  scheduledAt: string;
  completedAt: string | null;
  provenance: "synthetic-demo" | "demo-simulation";
}

export type FollowUpState = "open" | "completed" | "canceled";

export interface FollowUpHistoryEntry {
  id: string;
  changedAt: string;
  changedBy: string;
  note: string;
  state: FollowUpState;
}

export interface FollowUp {
  id: string;
  reporterId: string;
  nextStep: string;
  assignedTeamMemberId: string;
  dueAt: string;
  state: FollowUpState;
  history: FollowUpHistoryEntry[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export interface CoachingNote {
  id: string;
  teamMemberId: string;
  reporterId: string | null;
  note: string;
  nextAction: string;
  dueAt: string;
  createdAt: string;
  createdBy: string;
}

export type ImprovementChangeType = "screening" | "onboarding" | "first-job-support";

export interface ImprovementSample {
  label: string;
  reporterCount: number;
  completedCount: number;
  observationComplete: boolean;
  note: string;
}

export interface Improvement {
  id: string;
  title: string;
  marketIds: MarketId[];
  changeType: ImprovementChangeType;
  hypothesis: string;
  changeSummary: string;
  ownerId: string;
  partnerDeliverable: string;
  reviewAt: string;
  observationWindow: DateWindow;
  samples: ImprovementSample[];
  limitations: string[];
}

export type ImprovementDecisionKind = "continue" | "change" | "stop";

export interface ImprovementDecision {
  id: string;
  improvementId: string;
  decision: ImprovementDecisionKind;
  rationale: string;
  decidedAt: string;
  decidedBy: string;
}

export interface ProcessDraftStep {
  id: string;
  order: number;
  instruction: string;
}

export interface ProcessDraft {
  id: string;
  improvementId: string;
  title: string;
  ownerId: string;
  trigger: string;
  steps: ProcessDraftStep[];
  status: "draft";
  updatedAt: string;
}

export interface SavedMarketPlan {
  id: string;
  marketId: MarketId;
  goal: number;
  assumptions: MarketAssumptions;
  planningWindow: DateWindow;
  savedAt: string;
  savedBy: string;
}

export interface SimulationState {
  simulatedAsOfAt: string;
  replayedScenarioIds: string[];
}

export interface DemoSnapshot {
  schemaVersion: 1;
  revision: number;
  fixedAsOfAt: string;
  simulation: SimulationState;
  markets: Market[];
  reporters: Reporter[];
  lifecycleEvents: LifecycleEvent[];
  screeningReviews: ScreeningReview[];
  jobs: Job[];
  followUps: FollowUp[];
  teamMembers: TeamMember[];
  coachingNotes: CoachingNote[];
  improvements: Improvement[];
  improvementDecisions: ImprovementDecision[];
  processDrafts: ProcessDraft[];
  savedMarketPlans: SavedMarketPlan[];
}
