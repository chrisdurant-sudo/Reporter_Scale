import { useState } from "react";
import type {
  ActionResult,
  AppTab,
  ImprovementsActions,
  ImprovementsViewModel,
  MarketsActions,
  MarketsViewModel,
  MarketOption,
  ReportersActions,
  ReportersViewModel,
  SelectedMarket,
} from "../contracts";
import { FIXED_AS_OF_AT } from "../contracts";
import { ImprovementsScreen } from "../features/improvements";
import { MarketsScreen } from "../features/markets";
import { ReportersScreen } from "../features/reporters";
import { AppShell } from "../shell";

const marketOptions: MarketOption[] = [
  { value: "ALL", shortLabel: "All markets", fullLabel: "All markets" },
  { value: "LAX", shortLabel: "LAX", fullLabel: "LAX — Los Angeles" },
  { value: "SFO", shortLabel: "SFO", fullLabel: "SFO — San Francisco" },
  { value: "DFW", shortLabel: "DFW", fullLabel: "DFW — Dallas–Fort Worth" },
  { value: "ORD", shortLabel: "ORD", fullLabel: "ORD — Chicago" },
  { value: "ATL", shortLabel: "ATL", fullLabel: "ATL — Atlanta" },
];

function unavailable<T = undefined>(): ActionResult<T> {
  return {
    ok: false,
    message: "This setup boundary is awaiting its implementation lane.",
    errors: [{ code: "SETUP_STUB", message: "Feature implementation is not integrated yet." }],
  };
}

const marketsActions: MarketsActions = {
  onSelectMarket: () => undefined,
  onPreviewPlan: () => unavailable(),
  onSavePlan: async () => unavailable(),
  onCancelPlan: () => undefined,
  onOpenReporterWork: () => undefined,
};

const reportersActions: ReportersActions = {
  onSaveScreening: async () => unavailable(),
  onUpdateFollowUp: async () => unavailable(),
  onPreviewOutreach: () => unavailable(),
  onSaveCoaching: async () => unavailable(),
};

const improvementsActions: ImprovementsActions = {
  onRecordDecision: async () => unavailable(),
  onCreateProcessDraft: async () => unavailable(),
  onUpdateProcessDraft: async () => unavailable(),
};

const emptyWeeklyReview = {
  windowLabel: "Setup baseline",
  summary: "Implementation lanes have not been integrated.",
  evidence: [],
  nextActions: [],
};

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("markets");
  const [selectedMarket, setSelectedMarket] = useState<SelectedMarket>("ALL");

  const marketsView: MarketsViewModel = {
    status: "loading",
    selectedMarket,
    rows: [],
    selectedPlan: null,
    statusMessage: "Preparing the five-market comparison…",
  };
  const reportersView: ReportersViewModel = {
    status: "loading",
    selectedMarket,
    marketLabel: marketOptions.find((market) => market.value === selectedMarket)?.fullLabel ?? "All markets",
    asOfLabel: "February 16, 2026",
    populationNote: "Recruiting-market ownership determines this work list.",
    stages: [],
    reporters: [],
    reporterDetails: [],
    teamMemberOptions: [],
    teamWorkload: [],
    statusMessage: "Preparing reporter work…",
  };
  const improvementsView: ImprovementsViewModel = {
    status: "loading",
    selectedMarket,
    improvements: [],
    teamMemberOptions: [],
    weeklyReview: emptyWeeklyReview,
    statusMessage: "Preparing improvement records…",
  };

  return (
    <AppShell
      activeTab={activeTab}
      selectedMarket={selectedMarket}
      marketOptions={marketOptions}
      demoDateLabel={new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(FIXED_AS_OF_AT),
      )}
      mutationStatus="idle"
      mutationMessage=""
      onTabChange={setActiveTab}
      onMarketChange={setSelectedMarket}
      onReset={async () => unavailable()}
      onRunSimulation={async () => unavailable()}
    >
      {activeTab === "markets" ? <MarketsScreen view={marketsView} actions={marketsActions} /> : null}
      {activeTab === "reporters" ? <ReportersScreen view={reportersView} actions={reportersActions} /> : null}
      {activeTab === "improvements" ? (
        <ImprovementsScreen view={improvementsView} actions={improvementsActions} />
      ) : null}
    </AppShell>
  );
}
