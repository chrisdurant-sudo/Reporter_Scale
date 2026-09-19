import { useState } from "react";
import type { DemoActionContext, DemoRecordKind, EvidenceBundleId, TeamCoachingRecordPayload, TeamCoachingReviewPayload, TeamPracticeSharePayload, TeamQualityRecordPayload, TeamTargetSaveRevisionPayload, WorkAssignPayload, WorkCreatePayload, WorkEditPayload, WorkTransitionPayload, WorkspaceNavigationTarget } from "../../contracts/v2";
import type { PreparedTeamView, TeamBoardStatus, TeamViewFilters } from "../../logic/team";
import { Panel } from "../../ui/interview";
import { displayDate } from "../../ui/presentationFormat";
import { WorkEditor } from "./WorkEditor";
import { MemberDrawer } from "./MemberDrawer";
import "./team.css";

export interface TeamScreenProps {
  readonly view: PreparedTeamView;
  readonly commandContext?: DemoActionContext;
  readonly onCreateRecordId?: (kind: DemoRecordKind) => string;
  readonly onChangeFilters?: (filters: TeamViewFilters) => void;
  readonly onNavigateTarget?: (target: WorkspaceNavigationTarget) => void;
  readonly preservedEvidenceContext?: boolean;
  readonly onEditWork?: (payload: WorkEditPayload) => Promise<void>;
  readonly onTransitionWork?: (payload: WorkTransitionPayload) => Promise<void>;
  readonly actions: {
    readonly onOpenEvidence: (evidenceId: EvidenceBundleId) => void;
    readonly onCreateWork?: (payload: WorkCreatePayload) => Promise<void>;
    readonly onReassignWork: (payload: WorkAssignPayload) => Promise<void>;
    readonly onSaveTargetRevision: (payload: TeamTargetSaveRevisionPayload) => Promise<void>;
    readonly onRecordQuality: (payload: TeamQualityRecordPayload) => Promise<void>;
    readonly onRecordCoaching: (payload: TeamCoachingRecordPayload) => Promise<void>;
    readonly onReviewCoaching: (payload: TeamCoachingReviewPayload) => Promise<void>;
    readonly onSharePractice: (payload: TeamPracticeSharePayload) => Promise<void>;
  };
}
const columns: readonly TeamBoardStatus[] = ["To do", "In progress", "Done"];
const domainLabel = (value: string) => value[0]!.toUpperCase() + value.slice(1);

/** Only prepared values and canonical command ports enter this workspace. */
export function TeamScreen(props: TeamScreenProps) {
  const { view, onChangeFilters, preservedEvidenceContext } = props;
  const [localView, setLocalView] = useState<"Work" | "Goals">("Work");
  const [selection, setSelection] = useState<{ kind: "work" | "member"; id: string } | null>(null);
  const filters = view.appliedTeamFilters;
  const selectedWork = selection?.kind === "work" ? view.workDetails.find((work) => work.id === selection.id) : undefined;
  const member = selection?.kind === "member" ? view.members.find((item) => item.id === selection.id) : undefined;
  const changeFilters = (next: TeamViewFilters) => onChangeFilters?.(next);
  const close = () => setSelection(null);
  const navigate = (target: WorkspaceNavigationTarget) => { close(); requestAnimationFrame(() => props.onNavigateTarget?.(target)); };
  const evidence = (id: EvidenceBundleId) => { close(); requestAnimationFrame(() => props.actions.onOpenEvidence(id)); };
  const window = view.appliedFilters.window;
  return <main aria-label="Team" className="workspace ip2-workspace team-workspace" data-testid="team-screen">
    <section aria-label="Team metrics" className="kpi-strip"><div><span>Open tasks</span><strong>{view.summary.openTasks}</strong></div><div><span>No owner</span><strong>{view.summary.unownedTasks}</strong></div><div><span>Programs owned</span><strong>{view.summary.programsOwned}</strong></div><div><span>Coaching due</span><strong>{view.summary.coachingDue}</strong><small>Current snapshot</small></div></section>
    <div aria-label="Team view controls" className="workspace-controls">{(["Work", "Goals"] as const).map((tab) => <button key={tab} type="button" className={tab === localView ? "is-active" : undefined} aria-pressed={tab === localView} onClick={() => setLocalView(tab)}>{tab}</button>)}</div>
    {localView === "Work" ? <><Panel title="Work board" className="team-board" tools={<button type="button" onClick={() => setSelection({ kind: "work", id: "new" })}>Add work</button>}>
      <div className="ip2-filters" aria-label="Team work filters"><label>Member <select aria-label="Member" value={filters.memberId ?? ""} onChange={(event) => changeFilters({ ...filters, memberId: event.target.value ? event.target.value as TeamViewFilters["memberId"] : null })}>{view.memberFilterOptions.map((item) => <option key={item.id ?? "all"} value={item.id ?? ""}>{item.name} ({item.count})</option>)}</select></label><label>Domain <select aria-label="Domain filter" value={filters.domains?.[0] ?? ""} onChange={(event) => changeFilters({ ...filters, domains: event.target.value ? [event.target.value as NonNullable<TeamViewFilters["domains"]>[number]] : [] })}><option value="">All domains</option>{view.addWorkOptions.domains.map((item) => <option key={item.domain} value={item.domain}>{domainLabel(item.domain)}</option>)}</select></label><label>Program <select aria-label="Program filter" value={filters.programIds?.[0] ?? ""} onChange={(event) => changeFilters({ ...filters, programIds: event.target.value ? [event.target.value as NonNullable<TeamViewFilters["programIds"]>[number]] : [] })}><option value="">All programs</option>{view.addWorkOptions.programs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button type="button" aria-pressed={filters.blocked === true} className={filters.blocked ? "is-active" : undefined} onClick={() => changeFilters({ ...filters, blocked: filters.blocked ? undefined : true })}>Blocked</button><button type="button" onClick={() => changeFilters({})}>Clear all</button><span>{view.board.length} items</span></div>
      <p className="ip2-scope">Filters apply to board and member work. Program and coaching counts keep their linked scope.{preservedEvidenceContext ? " Showing exact linked work; changing a filter restores the work list." : ""}</p>
      <div className="team-board__columns">{columns.map((column) => { const items = view.board.filter((item) => item.status === column); return <section aria-label={column} className="team-board__column" key={column}><header><span>{column}</span><span>{items.length}</span></header>{items.length ? items.map((item) => <article className="team-board__card" key={item.id}><button className="team-board__title" type="button" onClick={() => setSelection({ kind: "work", id: item.id })}>{item.title}</button><p>{item.ownerName} · {item.ownershipDomain}</p><p>{item.unscoped ? "Unscoped" : item.marketIds.join(", ")} · {item.relatedRecordLabel}</p>{item.programTitle ? <p>Linked: {item.programTitle}</p> : null}<div className="team-board__meta"><span className={`status-tag ${item.blocked ? "status-tag--at" : item.status === "Done" ? "status-tag--under" : "status-tag--not-applicable"}`}>{item.blocked ? "Blocked" : item.status}</span>{item.priority ? <span className="status-tag status-tag--not-applicable">{item.priority}</span> : null}<span className="ip2-push">{item.dueAt ? `Due ${displayDate(item.dueAt)}` : "Due date unknown"}</span></div>{item.blockerCode ? <p>{item.blockerCode.replaceAll("-", " ")}</p> : null}</article>) : <p className="ip2-scope">No work</p>}</section>; })}</div>
    </Panel><Panel title="Team" tools={<span>{view.members.length} shown</span>}><div className="table-scroll"><table><thead><tr><th>Member</th><th>Owned domain</th><th>Open work</th><th>Goal</th><th>Coaching</th></tr></thead><tbody>{view.memberCompactValues.map((item) => <tr key={item.id}><th><button type="button" onClick={() => setSelection({ kind: "member", id: item.id })}>{item.name}</button></th><td>{item.ownedDomains.map(domainLabel).join(", ") || "—"}</td><td>{item.openWork}</td><td>{item.goal === null ? "No comparable goal" : `${item.goal} tasks`}</td><td>{item.coachingDue ? `${item.coachingDue} due` : "Clear"}</td></tr>)}</tbody></table></div></Panel></> : <Panel className="team-goals" title="Team goals and coaching" tools={<span>{window ? `${displayDate(window.startAt)} – ${displayDate(window.endAt)} (end exclusive)` : "No reporting window"}</span>}><div className="table-scroll"><table><thead><tr><th>Member / role</th><th>Open / overdue</th><th>Completed / target</th><th>Quality sample</th><th>Next review</th><th>Action</th></tr></thead><tbody>{view.members.map((item) => <tr key={item.id}><td>{item.name}<small>{item.role}</small></td><td>{item.filteredOpenWorkload} / {item.overdueWorkload}<small>{item.unknownDueWorkload} due dates unknown</small></td><td>{item.completed.completed} / {item.completed.target ?? "No comparable target"} tasks{item.completed.target !== null && item.completed.target > 0 ? <progress max={item.completed.target} value={item.completed.completed} aria-label={`${item.name} completed tasks against target`} /> : null}<small>{item.completed.target === null ? "No comparable target in this selection" : "Matching role / reporting window"}</small></td><td>{item.quality.passedCount} / {item.quality.inspectedCount} inspected passed<small>{item.quality.ratio === null ? "No inspected sample" : `${new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(item.quality.ratio)} of inspected work`}</small></td><td>{item.coachingActions.length ? item.coachingActions.map((action) => <small key={action.id}>{displayDate(action.reviewAt)}</small>) : "No review recorded"}</td><td><button type="button" onClick={() => setSelection({ kind: "member", id: item.id })}>Inspect & coach →</button></td></tr>)}</tbody></table></div><p className="ip2-scope">Completion follows the original completion actor. Quality is an inspected sample, not a score for all work.</p></Panel>}
    {view.evidence[0] ? <div className="workspace-actions"><button type="button" onClick={() => evidence(view.evidence[0]!.id)}>Why this?</button></div> : null}
    {selection?.kind === "work" && (selection.id === "new" || selectedWork) ? <WorkEditor key={selection.id} {...props} detail={selectedWork} onClose={close} onNavigate={navigate} /> : null}
    {member ? <MemberDrawer key={member.id} {...props} member={member} onClose={close} onOpenWork={(id) => setSelection({ kind: "work", id })} onEvidence={evidence} /> : null}
  </main>;
}
