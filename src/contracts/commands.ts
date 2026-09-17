import type {
  DateWindow,
  ImprovementDecisionKind,
  MarketAssumptions,
  MarketId,
  ProcessDraftStep,
  ScreeningCheck,
  ScreeningOutcome,
} from "./models";

export interface ActionError {
  code: string;
  field?: string;
  message: string;
}

export type ActionResult<T = undefined> =
  | { ok: true; value: T; message: string; revision?: number }
  | { ok: false; errors: ActionError[]; message: string; revision?: number };

export interface CommandContext {
  commandId: string;
  expectedRevision: number;
  actorId: string;
  occurredAt: string;
}

export interface MarketPlanInput {
  marketId: MarketId;
  goal: number;
  assumptions: MarketAssumptions;
  planningWindow: DateWindow;
}

export interface MarketPlanPreview {
  marketId: MarketId;
  goal: number;
  requiredScreeningStarts: number;
  requiredOnboardingStarts: number;
  requiredReadyReporters: number;
  earliestExpectedFirstJobAt: string;
  limitation: string;
}

export interface SaveScreeningInput {
  reporterId: string;
  checks: ScreeningCheck[];
  unresolvedInformation: string[];
  reason: string;
  outcome: ScreeningOutcome;
  reviewerId: string;
}

export interface UpdateFollowUpInput {
  reporterId: string;
  followUpId?: string;
  nextStep: string;
  assignedTeamMemberId: string;
  dueAt: string;
  state: "open" | "completed" | "canceled";
  note: string;
}

export interface OutreachPreviewInput {
  reporterId: string;
  nextStep: string;
  dueAt: string;
}

export interface OutreachPreview {
  reporterId: string;
  recipientLabel: string;
  subject: string;
  body: string;
  disclosure: "Preview only — no message will be sent.";
}

export interface SaveCoachingInput {
  teamMemberId: string;
  reporterId: string | null;
  note: string;
  nextAction: string;
  dueAt: string;
}

export interface RecordDecisionInput {
  improvementId: string;
  decision: ImprovementDecisionKind;
  rationale: string;
}

export interface CreateProcessDraftInput {
  improvementId: string;
  title: string;
  ownerId: string;
  trigger: string;
  steps: ProcessDraftStep[];
}

export interface UpdateProcessDraftInput {
  draftId: string;
  title: string;
  ownerId: string;
  trigger: string;
  steps: ProcessDraftStep[];
}

export interface RunSimulationInput {
  scenarioId: typeof import("./scenario").SCENARIO_IDS.lateFirstJob;
}
