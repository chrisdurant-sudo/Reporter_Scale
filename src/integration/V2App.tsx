import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AttendanceMode,
  CapabilityCode,
  DemoSnapshotV2,
  EvidenceBundle,
  MarketId,
  MetricDefinitionRef,
  ProgramNote,
  ProcessVersion,
  ProgramDecision,
  ReporterId,
  UtcTimestamp,
  WorkspaceFilterPayload,
  WorkspaceId,
  WorkspaceNavigationTarget,
  WorkspaceQueryContext,
  WorkItem,
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
import { prepareMarketsWorkspace } from "../logic/capacity";
import { prepareNetworkView } from "../logic/network";
import { prepareProgramsView } from "../logic/programs";
import {
  applyRecruitingLocalNoteCommand,
  prepareRecruitingWorkspace,
} from "../logic/recruiting";
import type {
  FunnelSlaInput,
  RecruitingLocalNoteCommand,
  RecruitingLocalNoteState,
} from "../logic/recruiting";
import { prepareTeamView } from "../logic/team";
import { V2AppShell } from "../shell";
import type { V2GlobalFilters } from "../shell/V2AppShell";
import { ErrorState, LoadingState } from "../ui/v2";

const MAIN_REQUEST_IDS = Array.from({ length: 10 }, (_, index) => `req-lax-${101 + index}` as never);
const RECRUITING_ENTRY_WINDOW = {
  startAt: "2026-02-01T00:00:00Z" as UtcTimestamp,
  endAt: "2026-03-01T00:00:00Z" as UtcTimestamp,
  boundary: "[start,end)" as const,
};
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
    requestIds: filters.selectedMarket === "LAX" ? MAIN_REQUEST_IDS : [],
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
  const [repository] = useState(createDemoRepositoryV2);
  const [snapshot, setSnapshot] = useState<DemoSnapshotV2 | null>(null);
  const snapshotRef = useRef<DemoSnapshotV2 | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("markets");
  const [globalFilters, setGlobalFilters] = useState<V2GlobalFilters>(INITIAL_FILTERS);
  const [drillDown, setDrillDown] = useState<WorkspaceNavigationTarget | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceBundle | null>(null);
  const evidenceTriggerRef = useRef<HTMLElement | null>(null);
  const [funnelSlaInput, setFunnelSlaInput] = useState<FunnelSlaInput>({});
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

  const resetDemo = useCallback(() => enqueue(async () => {
    setBusy(true);
    try {
      const result = await repository.reset();
      if (!result.ok) {
        setFeedback({ changed: "Nothing was reset.", notChanged: result.message });
        return;
      }
      acceptSnapshot(result.value);
      setActiveWorkspace("markets");
      setGlobalFilters(INITIAL_FILTERS);
      setDrillDown(null);
      setSelectedEvidence(null);
      evidenceTriggerRef.current = null;
      setFunnelSlaInput({});
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
    ? prepareMarketsWorkspace(snapshot, queryContext("markets", snapshot, globalFilters, drillDown))
    : null, [drillDown, globalFilters, snapshot]);
  const recruitingView = useMemo(() => snapshot
    ? prepareRecruitingWorkspace(snapshot, queryContext("recruiting", snapshot, globalFilters, drillDown), { slaInput: funnelSlaInput })
    : null, [drillDown, funnelSlaInput, globalFilters, snapshot]);
  const reportersView = useMemo(() => snapshot
    ? prepareNetworkView(snapshot, queryContext("reporters", snapshot, globalFilters, drillDown))
    : null, [drillDown, globalFilters, snapshot]);
  const teamView = useMemo(() => snapshot
    ? prepareTeamView(snapshot, queryContext("team", snapshot, globalFilters, drillDown), asMetric(snapshot, "M11"))
    : null, [drillDown, globalFilters, snapshot]);
  const programsView = useMemo(() => snapshot
    ? prepareProgramsView(snapshot, queryContext("programs", snapshot, globalFilters, drillDown))
    : null, [drillDown, globalFilters, snapshot]);

  const workspaceEvidence = useMemo(() => {
    if (activeWorkspace === "markets") return marketsView?.evidence ?? [];
    if (activeWorkspace === "recruiting") return recruitingView?.evidence ?? [];
    if (activeWorkspace === "reporters") return reportersView?.evidence ?? [];
    if (activeWorkspace === "team") return teamView?.evidence ?? [];
    return programsView?.evidence ?? [];
  }, [activeWorkspace, marketsView, programsView, recruitingView, reportersView, teamView]);

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
      view={marketsView}
      onSelectMarket={(value) => { if (isMarket(value)) { setGlobalFilters((current) => ({ ...current, selectedMarket: value })); setDrillDown(null); } }}
      onOpenEvidence={openEvidenceTarget}
      onNavigateWorkspace={(workspace) => { setActiveWorkspace(workspace); setSelectedEvidence(null); evidenceTriggerRef.current = null; }}
      onPreviewGoal={() => setFeedback({ changed: "Prepared the dated two-addition goal preview from the current record-backed baseline.", notChanged: "No goal, task, readiness, coverage, acceptance, or first-job record changed." })}
      onSaveGoal={() => { void savePlan(); }}
    />;
    if (activeWorkspace === "recruiting") return <RecruitingScreen
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
    if (activeWorkspace === "reporters") return <ReportersNetworkScreen view={reportersView} actions={{
      onConfirmAvailability: (input) => appendAvailability(input.reporterId, input.confirmedAt),
      onCreateReengagementTask: appendReengagementTask,
      onOpenEvidence: (id) => openEvidence(findEvidence(String(id))),
      onOpenRecruitingChecklist: (reporterId) => {
        const acquisition = snapshot.acquisitionCases.find((item) => item.reporterId === reporterId);
        const evidence = reportersView.evidence[0];
        if (!evidence) return;
        openWork({
          workspace: "recruiting",
          intent: "record-detail",
          filters: {
            ...filtersFor("recruiting", globalFilters),
            reporterIds: [reporterId],
            acquisitionCaseIds: acquisition ? [acquisition.id] : [],
            recordRefs: [{ kind: "reporter", id: reporterId }, ...(acquisition ? [{ kind: "acquisition-case" as const, id: acquisition.id }] : [])],
          },
          evidenceContext: evidence.navigationTarget.evidenceContext,
        });
      },
    }} />;
    if (activeWorkspace === "team") return <TeamScreen view={teamView} actions={{
      onOpenEvidence: (id) => openEvidence(findEvidence(String(id))),
      onCreateWork: async (payload) => {
        await saveMutation(
          `Created canonical Team work: ${payload.title}.`,
          "Readiness, acceptance, jobs, and program outcomes did not change.",
          (current) => {
            const id = `work-team-${current.revision + 1}` as never;
            const kind: WorkItem["kind"] = payload.domain === "sourcing"
              ? "source"
              : payload.domain === "screening"
                ? "screen"
                : payload.domain === "onboarding"
                  ? "onboard"
                  : payload.domain === "program"
                    ? "partner-task"
                    : "first-opportunity";
            const item: WorkItem = {
              id,
              title: payload.title,
              kind,
              primaryEntityRef: payload.programId
                ? { kind: "program", id: payload.programId }
                : payload.ownerId
                  ? { kind: "team-member", id: payload.ownerId }
                  : { kind: "work-item", id },
              relatedRequestIds: [],
              programId: payload.programId,
              createdAt: current.currentAsOfAt,
              ownerHistory: [{
                ownerId: payload.ownerId,
                occurredAt: current.currentAsOfAt,
                actorId: "actor-team-1" as never,
                reason: "Created from the Team work board.",
              }],
              dueAt: null,
              statusHistory: [{
                status: payload.status,
                occurredAt: current.currentAsOfAt,
                actorId: "actor-team-1" as never,
                reason: "Initial Team board status.",
              }],
              blockerCode: null,
              completionEvidenceRefs: [],
              provenance: "demo-simulation",
            };
            return { ...current, workItems: [...current.workItems, item] };
          },
        );
      },
      onReassignWork: async (payload) => {
        await saveMutation(
          "Reassigned the canonical work item.",
          "Historic completion credit, readiness, acceptance, and outcomes did not change.",
          (current) => ({
            ...current,
            workItems: current.workItems.map((item) => item.id === payload.workItemId ? {
              ...item,
              ownerHistory: [...item.ownerHistory, {
                ownerId: payload.ownerId,
                occurredAt: current.currentAsOfAt,
                actorId: "actor-team-1" as never,
                reason: payload.reason,
              }],
            } : item),
          }),
        );
      },
      onSaveTargetRevision: async (payload) => {
        await saveMutation("Saved a role-target revision.", "Observed work, readiness, acceptance, and outcomes did not change.", (current) => ({ ...current, teamTargets: [...current.teamTargets, payload.target] }));
      },
      onRecordQuality: async (payload) => {
        await saveMutation("Recorded one inspected quality sample.", "Uninspected work and operational outcomes did not change.", (current) => ({ ...current, workQualityChecks: [...current.workQualityChecks, payload.qualityCheck] }));
      },
      onRecordCoaching: async (payload) => {
        await saveMutation("Recorded a coaching action and review date.", "No automatic score, readiness, acceptance, or outcome was created.", (current) => ({ ...current, coachingActions: [...current.coachingActions, payload.coachingAction] }));
      },
      onReviewCoaching: async (payload) => {
        await saveMutation("Recorded the coaching follow-up review.", "No automatic ranking or operational outcome changed.", (current) => ({ ...current, coachingActions: current.coachingActions.map((item) => item.id === payload.coachingActionId ? { ...item, outcomeNote: payload.outcomeNote, updatedAt: payload.reviewedAt } : item) }));
      },
      onSharePractice: async (payload) => {
        await saveMutation("Saved a positive practice-sharing action.", "No automatic score or operational outcome changed.", (current) => ({ ...current, coachingActions: [...current.coachingActions, payload.coachingAction] }));
      },
    }} />;
    return <ProgramsScreen view={programsView} actions={{
      onEditProgram: (programId, field, value) => saveMutation(`Updated the program ${field}.`, "Program results, enrollments, readiness, acceptance, and jobs did not change.", (current) => ({ ...current, programs: current.programs.map((program) => program.id === programId ? { ...program, [field]: value } as typeof program : program) })),
      onSaveProgramText: (payload) => {
        const row = programsView.rows.find((item) => item.id === payload.programId);
        const savedText = payload.field === "note" ? row?.latestNote ?? "" : row?.latestNextStep ?? row?.nextStep ?? "";
        if (payload.text === savedText) return Promise.resolve();
        return saveMutation(
          `Saved the program ${payload.field === "note" ? "note" : "next step"}.`,
          "Program results, stage, enrollment, rollout, readiness, acceptance, and jobs did not change.",
          (current) => {
            const note: ProgramNote = {
              id: `program-${payload.field}-${payload.programId}-${current.revision + 1}` as never,
              programId: payload.programId,
              authorId: "actor-team-2" as never,
              kind: payload.field,
              text: payload.text,
              createdAt: current.currentAsOfAt,
              provenance: "demo-simulation",
            };
            return { ...current, programNotes: [...current.programNotes, note] };
          },
        );
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
    focusCondition={activeWorkspace === "markets"
      ? marketsView?.overview?.focus.finding
      : activeWorkspace === "recruiting"
        ? recruitingView?.focusCondition
        : undefined}
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
    {drillDown ? <section aria-label="Preserved evidence context">
      <p><strong>Evidence context preserved:</strong> {drillDown.evidenceContext.metric.id} {drillDown.evidenceContext.metric.version} · as of {displayDate(drillDown.evidenceContext.asOfAt)} · revision {drillDown.evidenceContext.snapshotRevision}.</p>
      <p>{drillDown.filters.requestIds.length} request, {drillDown.filters.reporterIds.length} reporter, {drillDown.filters.acquisitionCaseIds.length} case, {drillDown.filters.workItemIds.length} work-item, and {drillDown.filters.programEnrollmentIds.length} enrollment filters are carried with this view.</p>
      <button type="button" onClick={() => setDrillDown(null)}>Clear drill-down</button>
    </section> : null}
    {renderWorkspace()}
  </V2AppShell>;
}
