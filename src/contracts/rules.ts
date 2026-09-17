import type {
  ActionResult,
  CommandContext,
  CreateProcessDraftInput,
  MarketPlanInput,
  MarketPlanPreview,
  OutreachPreview,
  RecordDecisionInput,
  RunSimulationInput,
  SaveCoachingInput,
  SaveScreeningInput,
  UpdateFollowUpInput,
  UpdateProcessDraftInput,
} from "./commands";
import type { DemoSnapshot, MarketId, SelectedMarket } from "./models";
import type { ImprovementsViewModel, MarketsViewModel, ReportersViewModel } from "./views";

export interface FirstJobMetric {
  reporterId: string;
  jobId: string;
  marketId: MarketId;
  completedAt: string;
}

export interface HistoricalRateMetric {
  marketId: MarketId | "ALL";
  windowDays: 14;
  matureEntrants: number;
  successfulEntrants: number;
  observingEntrants: number;
  rate: number | null;
  explanation: string;
}

export interface RulesEngine {
  selectFirstJobs(snapshot: DemoSnapshot): FirstJobMetric[];
  calculateHistorical14DayRate(snapshot: DemoSnapshot, market: SelectedMarket): HistoricalRateMetric;
  previewMarketPlan(snapshot: DemoSnapshot, input: MarketPlanInput): ActionResult<MarketPlanPreview>;
  buildMarketsView(snapshot: DemoSnapshot, market: SelectedMarket): MarketsViewModel;
  buildReportersView(snapshot: DemoSnapshot, market: SelectedMarket): ReportersViewModel;
  buildImprovementsView(snapshot: DemoSnapshot, market: SelectedMarket): ImprovementsViewModel;
  previewOutreach(snapshot: DemoSnapshot, reporterId: string): ActionResult<OutreachPreview>;
  saveMarketPlan(snapshot: DemoSnapshot, input: MarketPlanInput, context: CommandContext): ActionResult<DemoSnapshot>;
  saveScreening(snapshot: DemoSnapshot, input: SaveScreeningInput, context: CommandContext): ActionResult<DemoSnapshot>;
  updateFollowUp(snapshot: DemoSnapshot, input: UpdateFollowUpInput, context: CommandContext): ActionResult<DemoSnapshot>;
  saveCoaching(snapshot: DemoSnapshot, input: SaveCoachingInput, context: CommandContext): ActionResult<DemoSnapshot>;
  recordDecision(snapshot: DemoSnapshot, input: RecordDecisionInput, context: CommandContext): ActionResult<DemoSnapshot>;
  createProcessDraft(snapshot: DemoSnapshot, input: CreateProcessDraftInput, context: CommandContext): ActionResult<DemoSnapshot>;
  updateProcessDraft(snapshot: DemoSnapshot, input: UpdateProcessDraftInput, context: CommandContext): ActionResult<DemoSnapshot>;
  runSimulation(snapshot: DemoSnapshot, input: RunSimulationInput, context: CommandContext): ActionResult<DemoSnapshot>;
}

export type RulesEngineFactory = () => RulesEngine;
