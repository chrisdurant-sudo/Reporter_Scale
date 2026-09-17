import { useState } from "react";
import type { PreparedProgramsView } from "../../logic/programs";
import "./programs.css";

export interface ProgramsScreenActions {
  readonly onEditProgram: (programId: string, field: "title" | "stage", value: string) => void | Promise<void>;
  readonly onRecordDecision: (programId: string, decision: "continue" | "change" | "stop" | "expand", rationale: string) => void | Promise<void>;
  readonly onSaveProcessDraft: (programId: string) => void | Promise<void>;
  readonly onCreatePartnerTask: (programId: string) => void | Promise<void>;
  readonly onOpenEvidence: (evidenceId: string) => void;
}

export function ProgramsScreen({ view, actions }: { readonly view: PreparedProgramsView; readonly actions: ProgramsScreenActions }) {
  const [selectedId, setSelectedId] = useState<string | null>(view.rows[0]?.id ?? null);
  const selected = view.rows.find((row) => row.id === selectedId) ?? null;
  const groups = selected ? view.resultsByProgram.get(selected.id) ?? [] : [];
  return <section className="programs" aria-labelledby="programs-heading">
    <header><p>Programs · synthetic demo</p><h2 id="programs-heading">Which growth efforts should we keep?</h2><span>Results are descriptive evidence, not causal proof or an automatic rollout.</span></header>
    <div className="programs__table-wrap"><table><caption>Editable program grid</caption><thead><tr><th>Program</th><th>Market need</th><th>Stage</th><th>Owner</th><th>Target</th><th>Result</th><th>Review date</th><th>Next step</th></tr></thead><tbody>{view.rows.map((row) => <tr key={row.id} aria-selected={selectedId === row.id}><th><button type="button" onClick={() => setSelectedId(row.id)}>{row.title}</button></th><td>{row.marketLabel}</td><td><select aria-label={`${row.title} stage`} value={row.stage} onChange={(event) => void actions.onEditProgram(row.id, "stage", event.target.value)}><option value="idea">Idea</option><option value="trying">Trying</option><option value="reviewing">Reviewing</option><option value="rolling-out">Rolling out</option><option value="closed">Closed</option></select></td><td>{row.ownerId}</td><td>{row.target ?? "No target"}</td><td>{row.result ? row.result.result === null ? "No participants" : `${row.result.timelyFirstJobs}/${row.result.entrants} (${Math.round(row.result.result * 100)}%)` : "Not measured"}</td><td>{row.reviewAt.slice(0, 10)}</td><td>{row.nextStep}</td></tr>)}</tbody></table></div>
    {selected ? <aside className="programs__detail"><h3>{selected.title}</h3><p>Who helps / What we need / What changes / What it produces / Who benefits are defined in the saved process, not board stages.</p><h4>Participant results</h4><ul>{groups.map((group) => <li key={group.groupId}><strong>{group.label}:</strong> {group.result === null ? "No participants in this market" : `${group.timelyFirstJobs} of ${group.entrants} within the identical ${view.rows.find((row) => row.id === selected.id) ? "declared" : ""} horizon`} <button type="button" onClick={() => actions.onOpenEvidence(group.evidence.id)}>Why this?</button></li>)}</ul><p>Limits: {groups.flatMap((group) => group.evidence.limitations).filter((item, index, values) => values.indexOf(item) === index).join(" ")}</p><div className="programs__actions"><button type="button" onClick={() => void actions.onRecordDecision(selected.id, "continue", "Continue with the documented evidence and review date.")}>Continue</button><button type="button" onClick={() => void actions.onRecordDecision(selected.id, "change", "Change proposal requires evidence and a reason.")}>Change</button><button type="button" onClick={() => void actions.onRecordDecision(selected.id, "stop", "Stop retains original membership, evidence, and reason.")}>Stop</button><button type="button" onClick={() => void actions.onRecordDecision(selected.id, "expand", "Propose a limited rollout; no markets change automatically.")}>Expand</button><button type="button" onClick={() => void actions.onSaveProcessDraft(selected.id)}>Save as process draft</button><button type="button" onClick={() => void actions.onCreatePartnerTask(selected.id)}>Create Team partner task</button></div><small>Partner task uses the Team callback. No real message or live collaboration is created. Saving a process or decision does not enroll people, manufacture outcomes, or roll out to another market.</small></aside> : null}
  </section>;
}
