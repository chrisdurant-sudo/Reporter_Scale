import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ActionResult,
  AppTab,
  CommandContext,
  DemoSnapshot,
  ImprovementsActions,
  ImprovementsViewModel,
  MarketsActions,
  MarketsViewModel,
  MarketOption,
  MutationStatus,
  ReportersActions,
  ReportersViewModel,
  SelectedMarket,
} from "../contracts";
import { FIXED_AS_OF_AT, SCENARIO_IDS } from "../contracts";
import { createDemoRepository } from "../data";
import { ImprovementsScreen } from "../features/improvements";
import { MarketsScreen } from "../features/markets";
import { ReportersScreen } from "../features/reporters";
import { createRulesEngine } from "../logic";
import { AppShell } from "../shell";

const marketOptions: MarketOption[] = [
  { value: "ALL", shortLabel: "All markets", fullLabel: "All markets" },
  { value: "LAX", shortLabel: "LAX", fullLabel: "LAX — Los Angeles" },
  { value: "SFO", shortLabel: "SFO", fullLabel: "SFO — San Francisco" },
  { value: "DFW", shortLabel: "DFW", fullLabel: "DFW — Dallas–Fort Worth" },
  { value: "ORD", shortLabel: "ORD", fullLabel: "ORD — Chicago" },
  { value: "ATL", shortLabel: "ATL", fullLabel: "ATL — Atlanta" },
];

function unavailable<T = undefined>(message = "The demo data is still loading."): ActionResult<T> {
  return { ok: false, message, errors: [{ code: "DEMO_NOT_READY", message }] };
}

function withoutSnapshot(result: ActionResult<DemoSnapshot>): ActionResult {
  if (!result.ok) return result;
  return { ok: true, value: undefined, message: result.message, revision: result.revision };
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

const emptyWeeklyReview = {
  windowLabel: "Loading",
  summary: "Preparing record-backed review data.",
  evidence: [],
  nextActions: [],
};

type SnapshotMutation = (snapshot: DemoSnapshot, context: CommandContext) => ActionResult<DemoSnapshot>;

export function App() {
  const [repository] = useState(createDemoRepository);
  const [rules] = useState(createRulesEngine);
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const snapshotRef = useRef<DemoSnapshot | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const commandNumberRef = useRef(0);
  const [activeTab, setActiveTab] = useState<AppTab>("markets");
  const [selectedMarket, setSelectedMarket] = useState<SelectedMarket>("ALL");
  const [requestedReporterId, setRequestedReporterId] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>("idle");
  const [mutationMessage, setMutationMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const acceptSnapshot = useCallback((next: DemoSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const enqueue = useCallback(function enqueueTask<T>(task: () => Promise<T>): Promise<T> {
    const run = queueRef.current.then(() => task(), () => task());
    queueRef.current = run.then(() => undefined, () => undefined);
    return run;
  }, []);

  useEffect(() => {
    let active = true;
    void enqueue(() => repository.load()).then((result) => {
      if (!active) return;
      if (result.ok) {
        acceptSnapshot(result.value);
        setLoadError("");
      } else {
        setLoadError(result.message);
      }
    });
    return () => {
      active = false;
    };
  }, [acceptSnapshot, enqueue, repository]);

  const runMutation = useCallback(
    (label: string, mutation: SnapshotMutation): Promise<ActionResult> =>
      enqueue(async () => {
        const current = snapshotRef.current;
        if (!current) return unavailable();
        setMutationStatus("saving");
        setMutationMessage(`${label}…`);
        commandNumberRef.current += 1;
        const context: CommandContext = {
          commandId: `${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${commandNumberRef.current}`,
          expectedRevision: current.revision,
          actorId: "team-maya",
          occurredAt: current.simulation.simulatedAsOfAt,
        };
        const changed = mutation(current, context);
        if (!changed.ok) {
          setMutationStatus("error");
          setMutationMessage(changed.message);
          return changed;
        }
        if (changed.value === current) {
          setMutationStatus("saved");
          setMutationMessage(changed.message);
          return withoutSnapshot(changed);
        }
        const saved = await repository.save(changed.value, current.revision);
        if (!saved.ok) {
          setMutationStatus("error");
          setMutationMessage(saved.message);
          return saved;
        }
        acceptSnapshot(saved.value);
        setMutationStatus("saved");
        setMutationMessage(changed.message);
        return { ok: true, value: undefined, message: changed.message, revision: saved.revision };
      }),
    [acceptSnapshot, enqueue, repository],
  );

  const resetDemo = useCallback(
    () =>
      enqueue(async (): Promise<ActionResult> => {
        setMutationStatus("saving");
        setMutationMessage("Restoring the demo baseline…");
        const result = await repository.reset();
        if (!result.ok) {
          setMutationStatus("error");
          setMutationMessage(result.message);
          return result;
        }
        acceptSnapshot(result.value);
        setRequestedReporterId(null);
        setMutationStatus("saved");
        const message = "Demo reset to the baseline. The current market selection was kept.";
        setMutationMessage(message);
        return { ok: true, value: undefined, message, revision: result.revision };
      }),
    [acceptSnapshot, enqueue, repository],
  );

  const marketsView: MarketsViewModel = snapshot
    ? rules.buildMarketsView(snapshot, selectedMarket)
    : { status: loadError ? "error" : "loading", selectedMarket, rows: [], selectedPlan: null, statusMessage: loadError || "Preparing the five-market comparison…" };

  const reportersView: ReportersViewModel = useMemo(() => {
    if (!snapshot) {
      return {
        status: loadError ? "error" : "loading",
        selectedMarket,
        marketLabel: marketOptions.find((market) => market.value === selectedMarket)?.fullLabel ?? "All markets",
        asOfLabel: displayDate(FIXED_AS_OF_AT),
        populationNote: "Recruiting-market ownership determines this work list.",
        stages: [],
        reporters: [],
        reporterDetails: [],
        teamMemberOptions: [],
        teamWorkload: [],
        statusMessage: loadError || "Preparing reporter work…",
      };
    }
    const view = rules.buildReportersView(snapshot, selectedMarket);
    const historical = rules.calculateHistorical14DayRate(snapshot, selectedMarket);
    const rateLabel = historical.rate === null ? "Not enough results yet" : `${Math.round(historical.rate * 100)}%`;
    return {
      ...view,
      populationNote: `${view.populationNote} Historical 14-day outcome: ${rateLabel}. ${historical.explanation}`,
    };
  }, [loadError, rules, selectedMarket, snapshot]);

  const improvementsView: ImprovementsViewModel = snapshot
    ? rules.buildImprovementsView(snapshot, selectedMarket)
    : { status: loadError ? "error" : "loading", selectedMarket, improvements: [], teamMemberOptions: [], weeklyReview: emptyWeeklyReview, statusMessage: loadError || "Preparing improvement records…" };

  const marketsActions = useMemo<MarketsActions>(
    () => ({
      onSelectMarket: (market) => {
        setSelectedMarket(market);
        setRequestedReporterId(null);
      },
      onPreviewPlan: (input) => {
        const current = snapshotRef.current;
        return current ? rules.previewMarketPlan(current, input) : unavailable();
      },
      onSavePlan: (input) => runMutation("Save market plan", (current, context) => rules.saveMarketPlan(current, input, context)),
      onCancelPlan: () => {
        setMutationStatus("idle");
        setMutationMessage("");
      },
      onOpenReporterWork: (marketId) => {
        setSelectedMarket(marketId);
        setRequestedReporterId(marketId === "LAX" ? SCENARIO_IDS.laxStalledReporter : null);
        setActiveTab("reporters");
      },
    }),
    [rules, runMutation],
  );

  const reportersActions = useMemo<ReportersActions>(
    () => ({
      onSaveScreening: (input) => runMutation("Save screening review", (current, context) => rules.saveScreening(current, input, context)),
      onUpdateFollowUp: (input) => runMutation("Save follow-up", (current, context) => rules.updateFollowUp(current, input, context)),
      onPreviewOutreach: (reporterId) => {
        const current = snapshotRef.current;
        return current ? rules.previewOutreach(current, reporterId) : unavailable();
      },
      onSaveCoaching: (input) => runMutation("Save coaching note", (current, context) => rules.saveCoaching(current, input, context)),
    }),
    [rules, runMutation],
  );

  const improvementsActions = useMemo<ImprovementsActions>(
    () => ({
      onRecordDecision: (input) => runMutation("Save improvement decision", (current, context) => rules.recordDecision(current, input, context)),
      onCreateProcessDraft: (input) => runMutation("Save process draft", (current, context) => rules.createProcessDraft(current, input, context)),
      onUpdateProcessDraft: (input) => runMutation("Update process draft", (current, context) => rules.updateProcessDraft(current, input, context)),
    }),
    [rules, runMutation],
  );

  function changeTab(tab: AppTab) {
    if (tab === "reporters") setRequestedReporterId(null);
    setActiveTab(tab);
  }

  function changeMarket(market: SelectedMarket) {
    setSelectedMarket(market);
    setRequestedReporterId(null);
  }

  const runSimulation = () =>
    runMutation("Run late first-job simulation", (current, context) =>
      rules.runSimulation(current, { scenarioId: SCENARIO_IDS.lateFirstJob }, context),
    );

  return (
    <AppShell
      activeTab={activeTab}
      selectedMarket={selectedMarket}
      marketOptions={marketOptions}
      demoDateLabel={displayDate(snapshot?.simulation.simulatedAsOfAt ?? FIXED_AS_OF_AT)}
      mutationStatus={mutationStatus}
      mutationMessage={mutationMessage}
      onTabChange={changeTab}
      onMarketChange={changeMarket}
      onReset={resetDemo}
      onRunSimulation={runSimulation}
    >
      {activeTab === "markets" ? <MarketsScreen view={marketsView} actions={marketsActions} /> : null}
      {activeTab === "reporters" ? (
        <ReportersScreen
          key={`${selectedMarket}-${requestedReporterId ?? "list"}`}
          view={reportersView}
          actions={reportersActions}
          initialReporterId={requestedReporterId}
        />
      ) : null}
      {activeTab === "improvements" ? <ImprovementsScreen view={improvementsView} actions={improvementsActions} /> : null}
    </AppShell>
  );
}
