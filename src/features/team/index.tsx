import { useState } from "react";
import type {
  EvidenceBundleId,
  TeamCoachingRecordPayload,
  TeamCoachingReviewPayload,
  TeamPracticeSharePayload,
  TeamQualityRecordPayload,
  TeamTargetSaveRevisionPayload,
  WorkAssignPayload,
  WorkCreatePayload,
} from "../../contracts/v2";
import type { PreparedTeamView, TeamBoardStatus } from "../../logic/team";
import "./team.css";

export interface TeamScreenProps {
  readonly view: PreparedTeamView;
  /** Integration owns command envelopes, revision handling, and persistence. */
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

const boardColumns: readonly TeamBoardStatus[] = ["To do", "In progress", "Done"];
const domains = ["sourcing", "screening", "onboarding", "market", "program"] as const;
const statuses = [{ label: "To do", value: "open" }, { label: "In progress", value: "in-progress" }, { label: "Done", value: "completed" }] as const;
const domainLabel = (domain: string) => domain[0]!.toUpperCase() + domain.slice(1);

/** Prepared-data-only Team surface. Integration supplies command construction and persistence. */
export function TeamScreen({ view, actions }: TeamScreenProps) {
  const [localView, setLocalView] = useState<"Work" | "Goals">("Work");
  const [addWorkOpen, setAddWorkOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({ title: "", ownerId: "", status: "open" as WorkCreatePayload["status"], domain: "sourcing" as WorkCreatePayload["domain"], programId: "" });
  const evidence = view.evidence[0];

  async function submitWork(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    if (!actions.onCreateWork) { setFeedback("Work creation is not available in this session."); return; }
    await actions.onCreateWork({ title: form.title.trim(), ownerId: form.ownerId ? form.ownerId as never : null, status: form.status, domain: form.domain, programId: form.programId ? form.programId as never : null });
    setForm({ title: "", ownerId: "", status: "open", domain: "sourcing", programId: "" });
    setFeedback("Work added.");
  }

  return <main aria-label="Team" className="workspace team-workspace" data-testid="team-screen">
    <section aria-label="Team metrics" className="kpi-strip">
      <div><span>Open tasks</span><strong>{view.summary.openTasks}</strong></div><div><span>No owner</span><strong>{view.summary.unownedTasks}</strong></div><div><span>Programs owned</span><strong>{view.summary.programsOwned}</strong></div><div><span>Coaching due</span><strong>{view.summary.coachingDue}</strong></div>
    </section>
    <div aria-label="Team view controls" className="workspace-controls">{(["Work", "Goals"] as const).map((item) => <button aria-pressed={localView === item} className={localView === item ? "is-active" : undefined} key={item} onClick={() => setLocalView(item)} type="button">{item}</button>)}</div>
    {localView === "Work" ? <><section aria-label="Team work board" className="panel team-board"><header><h2>Work board</h2><div><span>{view.board.length} items</span><button aria-expanded={addWorkOpen} onClick={() => setAddWorkOpen((open) => !open)} type="button">{addWorkOpen ? "Close" : "Add work"}</button></div></header><div className="team-board__columns">{boardColumns.map((column) => { const items = view.board.filter((item) => item.status === column); return <section className="team-board__column" key={column}><header><span>{column}</span><span>{items.length}</span></header>{items.length ? items.map((item) => <article className="team-board__card" key={item.id}><strong>{item.title}</strong><p>{item.ownerName} · {domainLabel(item.ownershipDomain)}</p>{item.programTitle ? <p>Linked: {item.programTitle}</p> : null}</article>) : <p className="team-board__empty">No work</p>}</section>; })}</div>{addWorkOpen ? <form aria-label="Add work" className="team-add-work" onSubmit={(event) => void submitWork(event)}><input aria-label="Work title" onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Work item" required value={form.title} /><select aria-label="Owner" onChange={(event) => setForm({ ...form, ownerId: event.target.value })} value={form.ownerId}>{view.addWorkOptions.owners.map((owner) => <option key={owner.id ?? "unassigned"} value={owner.id ?? ""}>{owner.name}</option>)}</select><select aria-label="Status" onChange={(event) => setForm({ ...form, status: event.target.value as WorkCreatePayload["status"] })} value={form.status}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><select aria-label="Domain" onChange={(event) => setForm({ ...form, domain: event.target.value as WorkCreatePayload["domain"] })} value={form.domain}>{domains.map((domain) => <option key={domain} value={domain}>{domainLabel(domain)}</option>)}</select><select aria-label="Linked program or campaign" onChange={(event) => setForm({ ...form, programId: event.target.value })} value={form.programId}><option value="">No linked program or campaign</option>{view.addWorkOptions.programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select><button className="team-add-work__submit" type="submit">Add</button></form> : null}{feedback ? <p aria-live="polite" className="team-board__feedback">{feedback}</p> : null}</section><MemberTable values={view.memberCompactValues} /></> : <section className="panel team-goals"><header><h2>Goals</h2><span>Role-aligned work targets</span></header><MemberTable values={view.memberCompactValues} /></section>}
    {evidence ? <div className="workspace-actions"><button className="why-this" onClick={() => actions.onOpenEvidence(evidence.id)} type="button">Why this?</button></div> : null}
  </main>;
}

function MemberTable({ values }: { readonly values: PreparedTeamView["memberCompactValues"] }) {
  return <section className="panel team-members"><header><h2>Team</h2><span>{values.length} shown</span></header><div className="table-scroll"><table><thead><tr><th>Member</th><th>Owned domain</th><th>Open work</th><th>Goal</th><th>Coaching</th></tr></thead><tbody>{values.map((member) => <tr key={member.id}><th>{member.name}</th><td>{member.ownedDomains.length ? member.ownedDomains.map(domainLabel).join(", ") : "—"}</td><td>{member.openWork}</td><td>{member.goal ?? "No goal"}</td><td>{member.coachingDue ? `${member.coachingDue} due` : "Clear"}</td></tr>)}</tbody></table></div></section>;
}
