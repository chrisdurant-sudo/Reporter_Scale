import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ActorId,
  AttendanceMode,
  CapabilityCode,
  DateWindow,
  DemoActionContext,
  DemoRecordKind,
  DemoSnapshotV2,
  EvidenceBundle,
  MarketId,
  MetricDefinitionRef,
  NetworkAvailabilityRecordPayload,
  NetworkCommandEnvelope,
  ProgramDecisionSavePayload,
  ProcessDraftSavePayload,
  ProgramsCommandEnvelope,
  ProcessVersion,
  ProgramDecision,
  ReporterId,
  SourceId,
  TeamCommandEnvelope,
  UtcTimestamp,
  WorkspaceFilterPayload,
  WorkspaceId,
  WorkspaceNavigationTarget,
  WorkspaceQueryContext,
  WorkItem,
  WorkCreatePayload,
  WorkEditPayload,
  WorkTransitionPayload,
} from "../contracts/v2";
import { REPORTING_TIME_ZONE, V2_MARKET_IDS } from "../contracts/v2";
import {
  SCENARIO_CONTRACT,
  V2_MAIN_REQUEST_WINDOW,
  applyScenarioCheckpoint,
  createDemoRepositoryV2,
} from "../data/v2";
import { MarketsV2Screen } from "../features/markets/MarketsV2Screen";
import { ProgramsScreen } from "../features/programs";
import { RecruitingScreen } from "../features/recruiting";
import { ReportersNetworkScreen } from "../features/reporters/network";
import { TeamScreen } from "../features/team";
import { prepareNetworkCommand, prepareNetworkView } from "../logic/network";
import { prepareProgramsCommand, prepareProgramsView } from "../logic/programs";
import {
  applyRecruitingLocalNoteCommand,
  prepareRecruitingWorkspace,
} from "../logic/recruiting";
import type {
  FunnelSlaInput,
  RecruitingLocalNoteCommand,
  RecruitingLocalNoteState,
  RecruitingRecordFilters,
} from "../logic/recruiting";
import { prepareTeamCommand, prepareTeamView, type TeamViewFilters } from "../logic/team";
import { V2AppShell } from "../shell";
import type { V2GlobalFilters } from "../shell/V2AppShell";
import { ErrorState, LoadingState } from "../ui/v2";
import { v2BrowserStorage } from "./v2BrowserStorage";
import { prepareInterviewOverview } from "./v2Overview";
import { commitV2Command } from "./v2CommandTransaction";
import { commitNetworkFollowUp, type NetworkFollowUpPayload } from "./v2NetworkComposition";
import { prepareWeeklyOperatingReview } from "./v2WeeklyReview";
import { composeProgramsCommand } from "./v2ProgramComposition";

const RECRUITING_ENTRY_COHORTS: readonly { readonly id: string; readonly label: string; readonly window: DateWindow }[] = [
  { id: "january-2026", label: "January 2026", window: {
    startAt: "2026-01-01T00:00:00Z" as UtcTimestamp, endAt: "2026-02-01T00:00:00Z" as UtcTimestamp, boundary: "[start,end)",
  } },
  { id: "february-2026", label: "February 2026", window: {
    startAt: "2026-02-01T00:00:00Z" as UtcTimestamp, endAt: "2026-03-01T00:00:00Z" as UtcTimestamp, boundary: "[start,end)",
  } },
];
const RECRUITING_ENTRY_WINDOW = RECRUITING_ENTRY_COHORTS[0]!.window;
const TEAM_REPORTING_WINDOW = {
  startAt: "2026-02-09T08:00:00Z" as UtcTimestamp,
  endAt: "2026-02-16T08:00:00Z" as UtcTimestamp,
  boundary: "[start,end)" as const,
};
const CAPABILITY_OPTIONS = [
  { value: "realtime-transcription" as CapabilityCode, label: "Realtime transcription" },
  { value: "standard-transcription" as CapabilityCode, label: "Standard transcription" },
] as const;
const ATTENDANCE_OPTIONS = [
  { value: "remote" as AttendanceMode, label: "Remote" },
  { value: "in-person" as AttendanceMode, label: "In person" },
] as const;

type CommandInput<T> = T extends { readonly context: unknown } ? Omit<T, "context"> : never;
type TeamCommandInput = CommandInput<TeamCommandEnvelope>;
type ProgramsCommandInput = CommandInput<ProgramsCommandEnvelope>;

interface ActionFeedback {
  readonly changed: string;
  readonly notChanged: string;
}

const INITIAL_FILTERS: V2GlobalFilters = {
  selectedMarket: "ALL",
  capabilityCodes: [],
  attendanceModes: [],
};

function isMarket(value: string): value is MarketId {
  return V2_MARKET_IDS.includes(value as MarketId);
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function marketBasis(workspace: WorkspaceId): WorkspaceFilterPayload["marketBasis"] {
  if (workspace === "markets") return "demand-market";
  if (workspace === "recruiting") return "recruiting-market-at-entry";
  if (workspace === "reporters") return "service-market";
  if (workspace === "programs") return "program-market-at-entry";
  return "all-markets";
}

function workspaceWindow(workspace: WorkspaceId): WorkspaceFilterPayload["window"] {
  if (workspace === "markets") return V2_MAIN_REQUEST_WINDOW;
  if (workspace === "recruiting") return RECRUITING_ENTRY_WINDOW;
  if (workspace === "team") return TEAM_REPORTING_WINDOW;
  return null;
}

function filtersFor(workspace: WorkspaceId, filters: V2GlobalFilters): WorkspaceFilterPayload {
  return {
    selectedMarket: filters.selectedMarket,
    marketBasis: marketBasis(workspace),
    marketIds: filters.selectedMarket === "ALL" ? [] : [filters.selectedMarket],
    reporterIds: [],
    acquisitionCaseIds: [],
    requestIds: [],
    workItemIds: [],
    programIds: [],
    programEnrollmentIds: [],
    sourceIds: [],
    jobOutcomeIds: [],
    capabilityCodes: filters.capabilityCodes,
    attendanceModes: filters.attendanceModes,
    recordRefs: [],
    window: workspaceWindow(workspace),
  };
}

function queryContext<TWorkspace extends WorkspaceId>(
  workspace: TWorkspace,
  snapshot: DemoSnapshotV2,
  filters: V2GlobalFilters,
  drillDown: WorkspaceNavigationTarget | null,
): WorkspaceQueryContext<TWorkspace> {
  const exact = drillDown?.workspace === workspace ? drillDown : null;
  return {
    workspace,
    evaluation: exact ? {
      asOfAt: exact.evidenceContext.asOfAt,
      snapshotRevision: exact.evidenceContext.snapshotRevision,
      reportingTimeZone: REPORTING_TIME_ZONE,
    } : {
      asOfAt: snapshot.currentAsOfAt,
      snapshotRevision: snapshot.revision,
      reportingTimeZone: REPORTING_TIME_ZONE,
    },
    filters: exact?.filters ?? filtersFor(workspace, filters),
  };
}

function actionContext(snapshot: DemoSnapshotV2, memberId: string, busy: boolean): DemoActionContext {
  const member = snapshot.teamMembers.find((item) => item.id === memberId
    && Date.parse(item.activeFrom) <= Date.parse(snapshot.currentAsOfAt)
    && (item.activeTo === null || Date.parse(item.activeTo) > Date.parse(snapshot.currentAsOfAt)));
  return { snapshotRevision: snapshot.revision, occurredAt: snapshot.currentAsOfAt, busy,
    actor: member ? { memberId: member.id, actorId: member.actorId, name: member.fictionalName } : null };
}

function createDemoRecordId(kind: DemoRecordKind): string {
  return `${kind}-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`;
}

function linkedSelectionLabel(target: WorkspaceNavigationTarget): string {
  const filters = target.filters;
  if (filters.matchNone) return "Empty evidence selection";
  const selections: readonly [readonly unknown[], string, string][] = [
    [filters.requestIds, "request", "requests"], [filters.workItemIds, "task", "tasks"],
    [filters.acquisitionCaseIds, "case", "cases"], [filters.programEnrollmentIds, "participant", "participants"],
    [filters.reporterIds, "reporter", "reporters"], [filters.programIds, "program", "programs"],
  ];
  const selection = selections.find(([ids]) => ids.length > 0);
  return selection ? `${selection[0].length} linked ${selection[0].length === 1 ? selection[1] : selection[2]}` : "Linked records";
}

function currentCheckpointIndex(snapshot: DemoSnapshotV2): number {
  let current = 0;
  SCENARIO_CONTRACT.checkpoints.forEach((checkpoint, index) => {
    const hasEvents = checkpoint.appliedEventIds.every((id) => snapshot.appliedScenarioEventIds.includes(id));
    if (hasEvents && Date.parse(snapshot.currentAsOfAt) >= Date.parse(checkpoint.asOfAt)) current = index;
  });
  return current;
}

function asMetric(snapshot: DemoSnapshotV2, id: string): MetricDefinitionRef {
  const definition = snapshot.metricDefinitions.find((item) => String(item.id) === id);
  if (!definition) throw new Error(`Missing frozen metric definition ${id}.`);
  return { id: definition.id, version: definition.version };
}

export function V2App() {
  const [repository] = useState(() => createDemoRepositoryV2(undefined, { storage: v2BrowserStorage }));
  const [snapshot, setSnapshot] = useState<DemoSnapshotV2 | null>(null);
  const snapshotRef = useRef<DemoSnapshotV2 | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("markets");
  const [globalFilters, setGlobalFilters] = useState<V2GlobalFilters>(INITIAL_FILTERS);
  const [drillDown, setDrillDown] = useState<WorkspaceNavigationTarget | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceBundle | null>(null);
  const evidenceTriggerRef = useRef<HTMLElement | null>(null);
  const [funnelSlaInput, setFunnelSlaInput] = useState<FunnelSlaInput>({});
  const [recruitingRecordFilters, setRecruitingRecordFilters] = useState<RecruitingRecordFilters>({});
  const [recruitingCohortId, setRecruitingCohortId] = useState(RECRUITING_ENTRY_COHORTS[0]!.id);
  const [recruitingSourceIds, setRecruitingSourceIds] = useState<readonly SourceId[]>([]);
  const [teamFilters, setTeamFilters] = useState<TeamViewFilters>({});
  const [recruitingNotes, setRecruitingNotes] = useState<RecruitingLocalNoteState>({
    persistence: "local-only-not-persisted",
    notes: [],
  });
  const [feedback, setFeedback] = useState<ActionFeedback>({
    changed: "Loaded the all-market baseline; the fixed LAX scenario remains available.",
    notChanged: "No scenario event or operational outcome has been applied.",
  });
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const acceptSnapshot = useCallback((next: DemoSnapshotV2) => {
    snapshotRef.current = next;
    setSnapshot(next);
    setLoadError("");
  }, []);

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = queueRef.current.then(task, task);
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
    return () => { active = false; };
  }, [acceptSnapshot, enqueue, repository]);

  const saveMutation = useCallback((
    changed: string,
    notChanged: string,
    mutate: (current: DemoSnapshotV2) => DemoSnapshotV2,
  ): Promise<void> => enqueue(async () => {
    const current = snapshotRef.current;
    if (!current) return;
    setBusy(true);
    try {
      const next = mutate(current);
      if (next === current) {
        setFeedback({ changed, notChanged });
        return;
      }
      const saved = await repository.save(next, current.revision);
      if (!saved.ok) {
        setFeedback({ changed: "Nothing was saved.", notChanged: saved.message });
        return;
      }
      acceptSnapshot(saved.value);
      setSelectedEvidence(null);
      setDrillDown(null);
      setFeedback({ changed, notChanged });
    } catch (error) {
      setFeedback({
        changed: "Nothing was saved.",
        notChanged: error instanceof Error ? error.message : "The requested demo action failed.",
      });
    } finally {
      setBusy(false);
    }
  }), [acceptSnapshot, enqueue, repository]);

  // A rejected save remains rejected so forms cannot acknowledge unsaved work.
  const submitTeamCommand = useCallback((
    input: TeamCommandInput,
    changed: string,
    notChanged: string,
    actorId: ActorId = "actor-team-1" as ActorId,
  ): Promise<void> => enqueue(async () => {
    const current = snapshotRef.current;
    if (!current) throw new Error("Wait for the demo snapshot to load.");
    setBusy(true);
    try {
      const command: TeamCommandEnvelope = {
        ...input,
        context: {
          commandId: `team-${crypto.getRandomValues(new Uint32Array(4)).join("-")}` as TeamCommandEnvelope["context"]["commandId"],
          expectedRevision: current.revision,
          actorId,
          occurredAt: current.currentAsOfAt,
        },
      };
      const result = await commitV2Command(repository, command, prepareTeamCommand);
      if (!result.ok) throw new Error(result.message);
      acceptSnapshot(result.value);
      setSelectedEvidence(null);
      setDrillDown(null);
      setFeedback({ changed: result.replayed ? result.message : changed, notChanged });
    } catch (error) {
      setFeedback({ changed: "Nothing was saved.", notChanged: error instanceof Error ? error.message : "The Team action failed." });
      throw error;
    } finally {
      setBusy(false);
    }
  }), [acceptSnapshot, enqueue, repository]);

  const submitProgramsCommand = useCallback((input: ProgramsCommandInput): Promise<void> => enqueue(async () => {
    const current = snapshotRef.current;
    if (!current) throw new Error("Wait for the demo snapshot to load.");
    setBusy(true);
    try {
      const command: ProgramsCommandEnvelope = {
        ...input, context: { commandId: `programs-${crypto.getRandomValues(new Uint32Array(4)).join("-")}` as ProgramsCommandEnvelope["context"]["commandId"],
          expectedRevision: current.revision, actorId: "actor-team-2" as ActorId, occurredAt: current.currentAsOfAt },
      };
      const result = await commitV2Command(repository, command,
        (value, action) => composeProgramsCommand(value, action, prepareProgramsCommand, prepareTeamCommand));
      if (!result.ok) throw new Error(result.message);
      acceptSnapshot(result.value);
      setSelectedEvidence(null); setDrillDown(null);
      setFeedback(command.type === "programs.note.save" ? {
        changed: `Saved the program ${command.payload.field === "note" ? "note" : "next step"}.`,
        notChanged: "Program results, stage, enrollment, rollout, readiness, acceptance, and jobs did not change.",
      } : { changed: result.message, notChanged: "Frozen enrollment, readiness, availability, assignments and job outcomes did not change. Saving a proposal or draft is not rollout." });
    } catch (error) {
      setFeedback({ changed: "Nothing was saved.", notChanged: error instanceof Error ? error.message : "The Programs action failed." });
      throw error;
    } finally { setBusy(false); }
  }), [acceptSnapshot, enqueue, repository]);

  const resetDemo = useCallback(() => enqueue(async () => {
    setBusy(true);
    try {
      const result = await repository.reset();
      if (!result.ok) {
        setFeedback({ changed: "Nothing was reset.", notChanged: result.message });
        if (!snapshotRef.current) setLoadError(result.message);
        return;
      }
      acceptSnapshot(result.value);
      setActiveWorkspace("markets");
      setGlobalFilters(INITIAL_FILTERS);
      setDrillDown(null);
      setSelectedEvidence(null);
      evidenceTriggerRef.current = null;
      setFunnelSlaInput({});
      setRecruitingRecordFilters({});
      setRecruitingCohortId(RECRUITING_ENTRY_COHORTS[0]!.id);
      setRecruitingSourceIds([]);
      setTeamFilters({});
      setRecruitingNotes({ persistence: "local-only-not-persisted", notes: [] });
      setFeedback({
        changed: "Restored the original seed, fixed clock, saved goal and decision state, and replay state.",
        notChanged: "No external data or system was touched.",
      });
    } finally {
      setBusy(false);
    }
  }), [acceptSnapshot, enqueue, repository]);

  const advanceScenario = useCallback(() => {
    const current = snapshotRef.current;
    if (!current) return Promise.resolve();
    const next = SCENARIO_CONTRACT.checkpoints[currentCheckpointIndex(current) + 1];
    if (!next) {
      setFeedback({ changed: "The final dated checkpoint is already applied.", notChanged: "No records, clock, goal, decision, or outcome changed." });
      return Promise.resolve();
    }
    return saveMutation(
      `Advanced to ${next.label} at ${displayDate(next.asOfAt)}.`,
      "Only the dated feed records for this checkpoint changed; unrelated goals, decisions, and program cohorts did not.",
      (value) => applyScenarioCheckpoint(value, String(next.id)),
    );
  }, [saveMutation]);

  const marketsView = useMemo(() => snapshot
    ? prepareInterviewOverview(snapshot, queryContext("markets", snapshot, globalFilters, drillDown))
    : null, [drillDown, globalFilters, snapshot]);
  const recruitingView = useMemo(() => {
    if (!snapshot) return null;
    const context = queryContext("recruiting", snapshot, globalFilters, drillDown);
    const exact = drillDown?.workspace === "recruiting";
    const entryWindow = RECRUITING_ENTRY_COHORTS.find((cohort) => cohort.id === recruitingCohortId)!.window;
    return prepareRecruitingWorkspace(snapshot, exact ? context : {
      ...context, filters: { ...context.filters, window: entryWindow, sourceIds: recruitingSourceIds },
    }, { slaInput: funnelSlaInput, filters: exact ? {} : recruitingRecordFilters });
  }, [drillDown, funnelSlaInput, globalFilters, recruitingCohortId, recruitingRecordFilters, recruitingSourceIds, snapshot]);
  const reportersView = useMemo(() => snapshot
    ? prepareNetworkView(snapshot, queryContext("reporters", snapshot, globalFilters, drillDown))
    : null, [drillDown, globalFilters, snapshot]);
  const teamView = useMemo(() => snapshot
    ? prepareTeamView(snapshot, queryContext("team", snapshot, globalFilters, drillDown), asMetric(snapshot, "M11"), drillDown?.workspace === "team" ? {} : teamFilters)
    : null, [drillDown, globalFilters, snapshot, teamFilters]);
  const programsView = useMemo(() => snapshot
    ? prepareProgramsView(snapshot, queryContext("programs", snapshot, globalFilters, drillDown))
    : null, [drillDown, globalFilters, snapshot]);
  const weeklyReview = useMemo(() => snapshot && activeWorkspace === "markets"
    ? prepareWeeklyOperatingReview(snapshot, globalFilters.selectedMarket, TEAM_REPORTING_WINDOW,
      RECRUITING_ENTRY_COHORTS.find((cohort) => cohort.id === recruitingCohortId)!.window)
    : null, [activeWorkspace, globalFilters.selectedMarket, recruitingCohortId, snapshot]);

  const workspaceEvidence = useMemo(() => {
    if (activeWorkspace === "markets") return marketsView?.evidence ?? [];
    if (activeWorkspace === "recruiting") return recruitingView?.evidence ?? [];
    if (activeWorkspace === "reporters") return reportersView?.evidence ?? [];
    if (activeWorkspace === "team") return teamView?.evidence ?? [];
    return programsView?.evidence ?? [];
  }, [activeWorkspace, marketsView, programsView, recruitingView, reportersView, teamView]);

  const focusCondition = activeWorkspace === "markets"
    ? marketsView?.overview?.focus.finding
    : activeWorkspace === "recruiting"
      ? recruitingView?.focusCondition
      : activeWorkspace === "reporters" && reportersView
        ? `${reportersView.reengagementCandidates.length} reporters with earlier work and no recent completion`
        : activeWorkspace === "team" && teamView
          ? teamView.summary.unownedTasks === 1
            ? "1 task needs an owner"
            : `${teamView.summary.unownedTasks} tasks need an owner`
          : activeWorkspace === "programs" && programsView
            ? programsView.summary.reviewNow === 1
              ? "1 review is due"
              : `${programsView.summary.reviewNow} reviews are due`
            : undefined;

  const findEvidence = useCallback((id: string) => workspaceEvidence.find((item) => String(item.id) === id) ?? null, [workspaceEvidence]);

  const openEvidence = useCallback((evidence: EvidenceBundle | null) => {
    if (!evidence) return;
    evidenceTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedEvidence(evidence);
  }, []);

  const openEvidenceTarget = useCallback((target: WorkspaceNavigationTarget) => {
    const evidence = workspaceEvidence.find((item) => item.navigationTarget === target) ?? null;
    openEvidence(evidence);
  }, [openEvidence, workspaceEvidence]);

  const closeEvidence = useCallback(() => {
    const trigger = evidenceTriggerRef.current;
    evidenceTriggerRef.current = null;
    setSelectedEvidence(null);
    window.requestAnimationFrame(() => trigger?.focus());
  }, []);

  useEffect(() => {
    if (!selectedEvidence) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeEvidence();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeEvidence, selectedEvidence]);

  const openWork = useCallback((target: WorkspaceNavigationTarget) => {
    setDrillDown(target);
    setActiveWorkspace(target.workspace);
    setGlobalFilters({
      selectedMarket: target.filters.selectedMarket,
      capabilityCodes: target.filters.capabilityCodes,
      attendanceModes: target.filters.attendanceModes,
    });
    setFeedback({
      changed: `Opened the exact ${target.intent.replaceAll("-", " ")} context for ${target.evidenceContext.metric.id}.`,
      notChanged: "The evidence as-of time, revision, metric version, record filters, and operational outcomes were preserved.",
    });
  }, []);

  const savePlan = useCallback(() => {
    const current = snapshotRef.current;
    if (!current) return Promise.resolve();
    const plan = SCENARIO_CONTRACT.checkpoints.find((item) => String(item.id) === "plan-saved")!;
    if (currentCheckpointIndex(current) > 0) {
      setFeedback({ changed: "The dated LAX goal is already saved.", notChanged: "Coverage, readiness, acceptance, and first-job outcomes remain record-derived and unchanged." });
      return Promise.resolve();
    }
    return saveMutation(
      "Saved the dated two-addition LAX readiness goal and retained the linked assigned work.",
      "Coverage remains 6 confirmed, 2 possible, and 2 without a verified ready match; readiness and first-job outcomes remain unchanged.",
      (value) => applyScenarioCheckpoint(value, String(plan.id)),
    );
  }, [saveMutation]);

  const recordAvailability = useCallback((payload: NetworkAvailabilityRecordPayload): Promise<void> => enqueue(async () => {
    const current = snapshotRef.current;
    if (!current) throw new Error("Wait for the demo snapshot to load.");
    setBusy(true);
    try {
      const command: NetworkCommandEnvelope = {
        type: "network.record-availability", payload,
        context: { commandId: `network-${crypto.getRandomValues(new Uint32Array(4)).join("-")}` as NetworkCommandEnvelope["context"]["commandId"],
          expectedRevision: current.revision, actorId: "actor-team-3" as ActorId, occurredAt: current.currentAsOfAt },
      };
      const result = await commitV2Command(repository, command, prepareNetworkCommand);
      if (!result.ok) throw new Error(result.message);
      acceptSnapshot(result.value);
      setSelectedEvidence(null); setDrillDown(null);
      setFeedback({ changed: result.message, notChanged: "No readiness, accepted assignment, job outcome or credential record changed." });
    } catch (error) {
      setFeedback({ changed: "Nothing was saved.", notChanged: error instanceof Error ? error.message : "Availability could not be saved." });
      throw error;
    } finally { setBusy(false); }
  }), [acceptSnapshot, enqueue, repository]);

  const requestFollowUp = useCallback((payload: NetworkFollowUpPayload): Promise<void> => enqueue(async () => {
    const current = snapshotRef.current;
    if (!current) throw new Error("Wait for the demo snapshot to load.");
    setBusy(true);
    try {
      const result = await commitNetworkFollowUp(repository, {
        commandId: `follow-up-${crypto.getRandomValues(new Uint32Array(4)).join("-")}` as TeamCommandEnvelope["context"]["commandId"],
        expectedRevision: current.revision, actorId: "actor-team-3" as ActorId, occurredAt: current.currentAsOfAt,
      }, payload);
      if (!result.ok) throw new Error(result.message);
      acceptSnapshot(result.value);
      setSelectedEvidence(null); setDrillDown(null);
      if (result.navigationTarget) openWork(result.navigationTarget);
      setFeedback({ changed: result.message, notChanged: result.navigationTarget
        ? "Availability, readiness, acceptance and completed-work outcomes did not change."
        : "Work is saved, but its exact detail target is unavailable. Operational outcomes did not change." });
    } catch (error) {
      setFeedback({ changed: "Nothing was saved.", notChanged: error instanceof Error ? error.message : "Follow-up could not be saved." });
      throw error;
    } finally { setBusy(false); }
  }), [acceptSnapshot, enqueue, openWork, repository]);

  const appendAvailability = useCallback((reporterId: ReporterId, confirmedAt: UtcTimestamp) => saveMutation(
    `Recorded a bounded availability confirmation for ${snapshotRef.current?.reporters.find((item) => item.id === reporterId)?.fictionalName ?? "the reporter"}.`,
    "No readiness, accepted assignment, or job outcome was created.",
    (current) => {
      const market = globalFilters.selectedMarket === "ALL" ? current.reporters.find((item) => item.id === reporterId)?.serviceMarketIds[0] : globalFilters.selectedMarket;
      if (!market) return current;
      return {
        ...current,
        availabilityWindows: [...current.availabilityWindows, {
          id: `availability-confirmed-${reporterId}-${current.revision + 1}` as never,
          reporterId,
          startAt: confirmedAt,
          endAt: new Date(Date.parse(confirmedAt) + 7 * 86_400_000).toISOString() as UtcTimestamp,
          status: "available",
          serviceMarketIds: [market],
          attendanceModes: globalFilters.attendanceModes.length ? globalFilters.attendanceModes : ["remote", "in-person"],
          recordedAt: confirmedAt,
          confirmationExpiresAt: new Date(Date.parse(confirmedAt) + 7 * 86_400_000).toISOString() as UtcTimestamp,
          source: "demo-simulation",
          actorId: "actor-team-3" as never,
          provenance: "demo-simulation",
        }],
      };
    },
  ), [globalFilters.attendanceModes, globalFilters.selectedMarket, saveMutation]);

  const appendReengagementTask = useCallback((reporterId: ReporterId) => saveMutation(
    `Created one canonical re-engagement work item for ${snapshotRef.current?.reporters.find((item) => item.id === reporterId)?.fictionalName ?? "the reporter"}.`,
    "Availability, readiness, acceptance, and completed-work outcomes did not change.",
    (current) => {
      if (current.workItems.some((item) => item.kind === "re-engage" && item.primaryEntityRef.kind === "reporter" && item.primaryEntityRef.id === reporterId)) return current;
      const item: WorkItem = {
        id: `work-reengage-${reporterId}-${current.revision + 1}` as never,
        kind: "re-engage",
        primaryEntityRef: { kind: "reporter", id: reporterId },
        relatedRequestIds: [],
        programId: null,
        createdAt: current.currentAsOfAt,
        ownerHistory: [{ ownerId: "team-3" as never, occurredAt: current.currentAsOfAt, actorId: "actor-team-3" as never, reason: "Confirm current availability without inferring willingness." }],
        dueAt: new Date(Date.parse(current.currentAsOfAt) + 3 * 86_400_000).toISOString() as UtcTimestamp,
        statusHistory: [{ status: "open", occurredAt: current.currentAsOfAt, actorId: "actor-team-3" as never, reason: "Re-engagement work created." }],
        blockerCode: "availability-needs-confirmation",
        completionEvidenceRefs: [],
        provenance: "demo-simulation",
      };
      return { ...current, workItems: [...current.workItems, item] };
    },
  ), [saveMutation]);

  const recordProgramDecision = useCallback((programId: string, decision: ProgramDecision["decision"], rationale: string) => saveMutation(
    `Saved the ${decision} decision with its current evidence for ${snapshotRef.current?.programs.find((item) => item.id === programId)?.title ?? "the program"}.`,
    "No participant, readiness, acceptance, job outcome, frozen cohort, or other market changed.",
    (current) => {
      const source = programsView?.evidence.find((item) => item.filters.programIds.some((id) => String(id) === programId));
      if (!source) return current;
      const evidence = { ...source, id: `evidence-decision-${programId}-${current.revision + 1}` as never, snapshotRevision: current.revision };
      const record: ProgramDecision = {
        id: `decision-${programId}-${current.revision + 1}` as never,
        programId: programId as never,
        decision,
        rationale,
        decidedBy: "actor-team-2" as never,
        decidedAt: current.currentAsOfAt,
        evidenceSnapshotId: evidence.id,
        nextReviewAt: new Date(Date.parse(current.currentAsOfAt) + 28 * 86_400_000).toISOString() as UtcTimestamp,
        provenance: "demo-simulation",
      };
      return { ...current, evidenceSnapshots: [...current.evidenceSnapshots, evidence], programDecisions: [...current.programDecisions, record] };
    },
  ), [programsView, saveMutation]);

  const saveProcessDraft = useCallback((programId: string) => saveMutation(
    `Saved a new versioned process draft for ${snapshotRef.current?.programs.find((item) => item.id === programId)?.title ?? "the program"}.`,
    "No rollout, enrollment, readiness, acceptance, outcome, or other market changed.",
    (current) => {
      const program = current.programs.find((item) => item.id === programId);
      const source = programsView?.evidence.find((item) => item.filters.programIds.some((id) => String(id) === programId));
      if (!program || !source) return current;
      const evidence = { ...source, id: `evidence-process-${programId}-${current.revision + 1}` as never, snapshotRevision: current.revision };
      const version = Math.max(0, ...current.processVersions.filter((item) => item.programId === program.id).map((item) => item.version)) + 1;
      const process: ProcessVersion = {
        id: `process-${programId}-${version}` as never,
        programId: program.id,
        version,
        status: "draft",
        trigger: "A defined program case reaches its documented review point.",
        ownerId: program.ownerId,
        requiredSteps: [{ id: "evidence-review", order: 1, instruction: "Review the exact linked records before taking the next action.", evidenceRequirement: "EvidenceBundle record references" }],
        exceptions: ["Unknown evidence remains unknown; no outcome is inferred."],
        approvalHistory: [{ status: "draft", actorId: "actor-team-2" as never, occurredAt: current.currentAsOfAt, rationale: "Draft saved from the inspected synthetic program evidence." }],
        evidenceSnapshotId: evidence.id,
        nextReviewAt: new Date(Date.parse(current.currentAsOfAt) + 28 * 86_400_000).toISOString() as UtcTimestamp,
        definitionVersion: `draft-${version}` as never,
        provenance: "demo-simulation",
      };
      return { ...current, evidenceSnapshots: [...current.evidenceSnapshots, evidence], processVersions: [...current.processVersions, process] };
    },
  ), [programsView, saveMutation]);

  const createPartnerTask = useCallback((programId: string) => saveMutation(
    `Created one canonical Team partner task for ${snapshotRef.current?.programs.find((item) => item.id === programId)?.title ?? "the program"}.`,
    "No program result, rollout, readiness, acceptance, or job outcome changed.",
    (current) => {
      const program = current.programs.find((item) => item.id === programId);
      if (!program) return current;
      const item: WorkItem = {
        id: `work-partner-${programId}-${current.revision + 1}` as never,
        kind: "partner-task",
        primaryEntityRef: { kind: "program", id: programId },
        relatedRequestIds: [],
        programId: program.id,
        createdAt: current.currentAsOfAt,
        ownerHistory: [{ ownerId: program.ownerId, occurredAt: current.currentAsOfAt, actorId: "actor-team-2" as never, reason: "Own the documented partner deliverable." }],
        dueAt: new Date(Date.parse(current.currentAsOfAt) + 7 * 86_400_000).toISOString() as UtcTimestamp,
        statusHistory: [{ status: "open", occurredAt: current.currentAsOfAt, actorId: "actor-team-2" as never, reason: "Partner deliverable created locally." }],
        blockerCode: null,
        completionEvidenceRefs: [],
        provenance: "demo-simulation",
      };
      return { ...current, workItems: [...current.workItems, item] };
    },
  ), [saveMutation]);

  const checkpointIndex = snapshot ? currentCheckpointIndex(snapshot) : 0;
  const checkpoint = SCENARIO_CONTRACT.checkpoints[checkpointIndex];
  const nextCheckpoint = SCENARIO_CONTRACT.checkpoints[checkpointIndex + 1] ?? null;

  function renderWorkspace() {
    if (loadError) return <ErrorState detail={loadError} />;
    if (!snapshot || !marketsView || !recruitingView || !reportersView || !teamView || !programsView) return <LoadingState />;
    if (activeWorkspace === "markets") return <MarketsV2Screen
      {...{ weeklyReview, onInspectEvidence: openEvidence, onNavigateTarget: openWork }}
      view={marketsView}
      onSelectMarket={(value) => { if (isMarket(value)) { setGlobalFilters((current) => ({ ...current, selectedMarket: value })); setDrillDown(null); } }}
      onOpenEvidence={openEvidenceTarget}
      onNavigateWorkspace={(workspace) => { setActiveWorkspace(workspace); setSelectedEvidence(null); evidenceTriggerRef.current = null; }}
      onPreviewGoal={() => setFeedback({ changed: "Prepared the dated two-addition goal preview from the current record-backed baseline.", notChanged: "No goal, task, readiness, coverage, acceptance, or first-job record changed." })}
      onSaveGoal={() => { void savePlan(); }}
    />;
    if (activeWorkspace === "recruiting") return <RecruitingScreen
      {...{
        onChangeRecordFilters: (next: RecruitingRecordFilters) => { setRecruitingRecordFilters(next); setDrillDown(null); },
        entryCohortOptions: RECRUITING_ENTRY_COHORTS,
        selectedEntryCohortId: recruitingCohortId,
        onChangeEntryCohort: (id: string) => {
          if (RECRUITING_ENTRY_COHORTS.some((cohort) => cohort.id === id)) { setRecruitingCohortId(id); setDrillDown(null); }
        },
        sourceOptions: snapshot.sources.map((source) => ({ id: source.id, label: source.label })),
        selectedSourceIds: recruitingSourceIds,
        onChangeSourceIds: (ids: readonly SourceId[]) => { setRecruitingSourceIds(ids); setDrillDown(null); },
        onNavigateTarget: openWork,
        onInspectEvidence: openEvidence,
        preservedEvidenceContext: drillDown?.workspace === "recruiting",
      }}
      view={recruitingView}
      slaInput={funnelSlaInput}
      localNotes={recruitingNotes}
      onChangeSlaInput={(next) => {
        setFunnelSlaInput(next);
        setFeedback({ changed: "Updated the local Funnel SLA input.", notChanged: "Lifecycle, readiness, acceptance, and completed-work facts did not change." });
      }}
      onLocalNoteCommand={(command: RecruitingLocalNoteCommand) => {
        const current = snapshotRef.current;
        if (!current) return;
        const result = applyRecruitingLocalNoteCommand(current, current.currentAsOfAt, recruitingNotes, command);
        if (result.ok) setRecruitingNotes(result.state);
        setFeedback({ changed: result.ok ? result.message : "No local note changed.", notChanged: result.ok ? "Canonical records and external systems were not changed." : result.message });
      }}
      onWhyThis={(id) => openEvidence(findEvidence(id))}
      onOpenWork={(id) => { const evidence = findEvidence(id); if (evidence) openWork(evidence.navigationTarget); }}
    />;
    if (activeWorkspace === "reporters") return <ReportersNetworkScreen
      {...{ commandContext: actionContext(snapshot, "team-3", busy), onNavigateTarget: openWork,
        onRecordAvailability: recordAvailability, onRequestFollowUp: requestFollowUp }}
      view={reportersView} actions={{
      onConfirmAvailability: (input) => appendAvailability(input.reporterId, input.confirmedAt),
      onCreateReengagementTask: appendReengagementTask,
      onOpenEvidence: openEvidence,
      onOpenRecruitingChecklist: (reporterId) => {
        const target = reportersView.reporters.find((row) => row.reporterId === reporterId)?.checklistTarget;
        if (target) openWork(target);
        else setFeedback({ changed: "No recruiting checklist is recorded for this reporter.", notChanged: "No unrelated case was opened and no records changed." });
      },
    }} />;
    if (activeWorkspace === "team") return <TeamScreen
      {...{ onChangeFilters: (next: TeamViewFilters) => { setTeamFilters(next); setDrillDown(null); }, onNavigateTarget: openWork,
        preservedEvidenceContext: drillDown?.workspace === "team", commandContext: actionContext(snapshot, "team-1", busy), onCreateRecordId: createDemoRecordId,
        onEditWork: (payload: WorkEditPayload) => submitTeamCommand({ type: "work.edit", payload }, "Saved the work changes and history.", "Readiness, acceptance, jobs and program outcomes did not change."),
        onTransitionWork: (payload: WorkTransitionPayload) => submitTeamCommand({ type: "work.transition", payload }, "Saved the work status and evidence.", "No operational outcome was manufactured by the status change.") }}
      view={teamView} actions={{
      onOpenEvidence: (id) => openEvidence(findEvidence(String(id))),
      onCreateWork: (payload) => submitTeamCommand(
        { type: "work.create", payload },
        `Created canonical Team work: ${payload.title}.`,
        "Readiness, acceptance, jobs, and program outcomes did not change.",
      ),
      onReassignWork: (payload) => submitTeamCommand(
        { type: "work.assign", payload }, "Reassigned the canonical work item.",
        "Historic completion credit, readiness, acceptance, and outcomes did not change.",
      ),
      onSaveTargetRevision: (payload) => submitTeamCommand(
        { type: "team.target.save-revision", payload }, "Saved a role-target revision.",
        "Observed work, readiness, acceptance, and outcomes did not change.",
      ),
      onRecordQuality: (payload) => submitTeamCommand(
        { type: "team.quality.record", payload }, "Recorded one inspected quality sample.",
        "Uninspected work and operational outcomes did not change.",
        snapshot.teamMembers.find((member) => member.id === payload.qualityCheck.checkedBy)?.actorId,
      ),
      onRecordCoaching: (payload) => submitTeamCommand(
        { type: "team.coaching.record", payload }, "Recorded a coaching action and review date.",
        "No automatic score, readiness, acceptance, or outcome was created.", payload.coachingAction.authorId,
      ),
      onReviewCoaching: (payload) => submitTeamCommand(
        { type: "team.coaching.review", payload }, "Recorded the coaching follow-up review.",
        "No automatic ranking or operational outcome changed.",
      ),
      onSharePractice: (payload) => submitTeamCommand(
        { type: "team.practice.share", payload }, "Saved a positive practice-sharing action.",
        "No automatic score or operational outcome changed.", payload.coachingAction.authorId,
      ),
    }} />;
    return <ProgramsScreen
      {...{ commandContext: actionContext(snapshot, "team-2", busy), onNavigateTarget: openWork,
        onSaveDecision: (payload: ProgramDecisionSavePayload) => submitProgramsCommand({ type: "programs.record-decision", payload }),
        onSaveDraft: (payload: ProcessDraftSavePayload) => submitProgramsCommand({ type: "programs.save-process-version", payload }),
        onCreateLinkedWork: (payload: WorkCreatePayload) => submitTeamCommand({ type: "work.create", payload }, "Saved the linked canonical Team work.", "No program outcome or rollout changed.", "actor-team-2" as ActorId) }}
      view={programsView} actions={{
      onEditProgram: (programId, field, value) => saveMutation(`Updated the program ${field}.`, "Program results, enrollments, readiness, acceptance, and jobs did not change.", (current) => ({ ...current, programs: current.programs.map((program) => program.id === programId ? { ...program, [field]: value } as typeof program : program) })),
      onSaveProgramText: (payload) => {
        const row = programsView.rows.find((item) => item.id === payload.programId);
        const savedText = payload.field === "note" ? row?.latestNote ?? "" : row?.latestNextStep ?? row?.nextStep ?? "";
        if (payload.text === savedText) return Promise.resolve();
        return submitProgramsCommand({ type: "programs.note.save", payload });
      },
      onRecordDecision: recordProgramDecision,
      onSaveProcessDraft: saveProcessDraft,
      onCreatePartnerTask: createPartnerTask,
      onOpenEvidence: (id) => openEvidence(findEvidence(id)),
    }} />;
  }

  return <V2AppShell
    activeWorkspace={activeWorkspace}
    filters={globalFilters}
    demoDateLabel={displayDate(snapshot?.currentAsOfAt ?? "2026-02-16T17:00:00Z")}
    capabilityOptions={CAPABILITY_OPTIONS}
    attendanceOptions={ATTENDANCE_OPTIONS}
    focusCondition={focusCondition}
    selectedEvidence={selectedEvidence}
    onCloseEvidence={closeEvidence}
    onOpenEvidenceWork={(target) => {
      evidenceTriggerRef.current = null;
      setSelectedEvidence(null);
      openWork(target);
    }}
    actionFeedback={<section aria-label="Scenario and action result">
      <p><strong>Checkpoint:</strong> {checkpoint?.label ?? "Baseline"}</p>
      <p role="status"><strong>Changed:</strong> {feedback.changed}</p>
      <p><strong>Not changed:</strong> {feedback.notChanged}</p>
      <button type="button" disabled={busy || !nextCheckpoint} onClick={() => { void advanceScenario(); }}>{nextCheckpoint ? `Advance to ${nextCheckpoint.label}` : "Final checkpoint reached"}</button>{" "}
      <button type="button" disabled={busy} onClick={() => { void resetDemo(); }}>Reset demo</button>
    </section>}
    onWorkspaceChange={(workspace) => { setActiveWorkspace(workspace); setSelectedEvidence(null); evidenceTriggerRef.current = null; }}
    onFiltersChange={(next) => { setGlobalFilters(next); setDrillDown(null); setSelectedEvidence(null); }}
  >
    {drillDown?.workspace === activeWorkspace ? <section aria-label="Preserved evidence context" className="v2-linked-selection">
      <p><strong>{linkedSelectionLabel(drillDown)}</strong> · {drillDown.filters.selectedMarket === "ALL" ? "All markets" : drillDown.filters.selectedMarket} · evidence as of {displayDate(drillDown.evidenceContext.asOfAt)}.</p>
      <button type="button" onClick={() => setDrillDown(null)}>Clear drill-down</button>
    </section> : null}
    {renderWorkspace()}
  </V2AppShell>;
}
