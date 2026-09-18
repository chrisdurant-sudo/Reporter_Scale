import { useMemo, useState } from "react";
import type { ProgramTextSavePayload } from "../../contracts/v2";
import type { PreparedProgramRow, PreparedProgramsView } from "../../logic/programs";
import "./programs.css";

export interface ProgramsScreenActions {
  readonly onEditProgram: (programId: string, field: "title" | "stage", value: string) => void | Promise<void>;
  readonly onRecordDecision: (programId: string, decision: "continue" | "change" | "stop" | "expand", rationale: string) => void | Promise<void>;
  readonly onSaveProcessDraft: (programId: string) => void | Promise<void>;
  readonly onCreatePartnerTask: (programId: string) => void | Promise<void>;
  readonly onOpenEvidence: (evidenceId: string) => void;
  /** Coordinator wiring owns the canonical Programs command boundary. */
  readonly onSaveProgramText?: (payload: ProgramTextSavePayload) => void | Promise<void>;
}

type ViewMode = "Programs" | "Results";
type ProgramType = "All" | "Experiment" | "Campaign" | "Sourcing" | "Process";
type ProgramStatus = "All" | "Running" | "Review now" | "Stopped";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
const stageLabel = (stage: PreparedProgramRow["stage"]): Exclude<ProgramStatus, "All"> => stage === "closed" ? "Stopped" : stage === "reviewing" ? "Review now" : "Running";
const typeLabel = (row: PreparedProgramRow): Exclude<ProgramType, "All"> => row.typeLabel;
const resultLabel = (row: PreparedProgramRow) => row.result?.result === null ? "Still observing" : row.result ? `${Math.round(row.result.result * 100)}%` : "Not measured";
const goalLabel = (row: PreparedProgramRow) => row.target === null ? "No declared target" : `${Math.round(row.target * 100)}% start work`;

function PilotTrend({ row, points }: { readonly row: PreparedProgramRow | null; readonly points: PreparedProgramsView["resultOverTime"] }) {
  const programPoints = row ? points.filter((point) => point.programId === row.id) : [];
  const values = programPoints.flatMap((point) => [point.result, point.target].filter((value): value is number => value !== null));
  const max = Math.max(1, ...values.map((value) => value * 100));
  const x = (index: number) => 14 + index * 76 / Math.max(1, programPoints.length - 1);
  const y = (point: number) => 88 - point * 70 / max;
  const line = (field: "result" | "target") => programPoints.flatMap((point, index) => point[field] === null ? [] : [`${x(index)},${y(point[field] * 100)}`]).join(" ");
  return <figure className="programs__chart" aria-label="Program result and target">
    <p>{row ? `${row.title} result over time is shown against its declared target.` : "Choose a program record to view its declared result."}</p>
    <div className="programs__plot-wrap">
      <span>Started work</span>
      <svg aria-label={row ? programPoints.map((point) => point.accessibleLabel).join(" ") : "No program selected."} role="img" viewBox="0 0 100 100">
        {[0, .25, .5, .75, 1].map((tick) => <g key={tick}><line className="programs__grid" x1="9" x2="96" y1={y(tick * max)} y2={y(tick * max)} /><text x="1" y={y(tick * max) + 2}>{Math.round(tick * max)}%</text></g>)}
        {line("target") ? <polyline className="programs__target" points={line("target")} /> : null}
        {line("result") ? <polyline className="programs__line" points={line("result")} /> : null}
        {programPoints.map((point, index) => point.result === null ? null : <g key={point.id}><circle className="programs__point" cx={x(index)} cy={y(point.result * 100)} r="2.4" /><text className="programs__value" x={x(index)} y={y(point.result * 100) - 4} textAnchor="middle">{Math.round(point.result * 100)}%</text><text x={x(index)} y="98" textAnchor="middle">{point.groupId}</text></g>)}
      </svg>
    </div>
    <figcaption><span className="programs__legend-result">Pilot result</span>{programPoints.some((point) => point.target !== null) ? <span className="programs__legend-target">Target</span> : null}</figcaption>
  </figure>;
}

function Attention({ rows, onSelect }: { readonly rows: readonly PreparedProgramRow[]; readonly onSelect: (id: string) => void }) {
  const attention = rows.filter((row) => stageLabel(row.stage) !== "Running").slice(0, 3);
  return <section className="panel attention programs__attention" aria-label="What needs attention"><header><h2>What needs attention</h2><span>{attention.length} items</span></header><ol>{attention.map((row, index) => <li key={row.id}><b>{index + 1}</b><div><small>{stageLabel(row.stage)}</small><strong>{row.title}</strong><button onClick={() => onSelect(String(row.id))} type="button">{row.nextStep}</button></div></li>)}</ol></section>;
}

/** Presentation-only Programs workspace. Prepared records and integration callbacks remain canonical. */
export function ProgramsScreen({ view, actions }: { readonly view: PreparedProgramsView; readonly actions: ProgramsScreenActions }) {
  const [mode, setMode] = useState<ViewMode>("Programs");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ProgramType>("All");
  const [status, setStatus] = useState<ProgramStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(view.rows[0] ? String(view.rows[0].id) : null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [nextSteps, setNextSteps] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const selected = view.rows.find((row) => String(row.id) === selectedId) ?? view.rows[0] ?? null;
  const rows = useMemo(() => view.rows.filter((row) => {
    const text = [row.title, row.marketLabel, row.nextStep, stageLabel(row.stage), typeLabel(row)].join(" ").toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (type === "All" || typeLabel(row) === type) && (status === "All" || stageLabel(row.stage) === status);
  }), [query, status, type, view.rows]);
  const select = (id: string) => { setSelectedId(id); setMode("Results"); };
  const updateDraft = (kind: "note" | "next", id: string, value: string) => {
    if (kind === "note") setNotes((current) => ({ ...current, [id]: value })); else setNextSteps((current) => ({ ...current, [id]: value }));
    setConfirmation(`${kind === "note" ? "Note" : "Next step"} is ready to save. Program outcomes and decisions do not change.`);
  };
  return <main aria-label="Programs" className="workspace programs">
    <section aria-label="Program metrics" className="kpi-strip"><div><span>Running</span><strong>{view.summary.running}</strong></div><div><span>Review now</span><strong>{view.summary.reviewNow}</strong></div><div><span>Expanding</span><strong>{view.summary.expanding}</strong></div><div><span>Stopped</span><strong>{view.summary.stopped}</strong></div></section>
    <div aria-label="Programs view controls" className="workspace-controls">{(["Programs", "Results"] as const).map((item) => <button aria-pressed={mode === item} className={mode === item ? "is-active" : undefined} key={item} onClick={() => setMode(item)} type="button">{item}</button>)}</div>
    <section className="programs__focus-grid"><Attention onSelect={select} rows={view.rows} /><section className="panel programs__result-panel"><header><h2>Pilot results</h2></header><PilotTrend points={view.resultOverTime} row={selected} /></section></section>
    {mode === "Results" && selected ? <section className="panel programs__result-detail"><header><div><h2>{selected.title}</h2><p>{selected.marketLabel} · review {formatDate(selected.reviewAt)}</p></div><button onClick={() => actions.onOpenEvidence(String(selected.result?.evidence.id ?? view.evidence[0]?.id ?? ""))} type="button">Why this?</button></header><div><p><strong>Goal:</strong> {goalLabel(selected)}</p><p><strong>Result:</strong> {resultLabel(selected)}</p><p><strong>Next review:</strong> {formatDate(selected.reviewAt)}</p><p>Results are descriptive source-backed evidence, not causal proof or an automatic rollout.</p></div><footer className="programs__actions"><button onClick={() => void actions.onRecordDecision(selected.id, "continue", "Continue with the documented evidence and review date.")} type="button">Continue</button><button onClick={() => void actions.onRecordDecision(selected.id, "change", "Change proposal requires evidence and a reason.")} type="button">Change</button><button onClick={() => void actions.onRecordDecision(selected.id, "stop", "Stop retains original membership, evidence, and reason.")} type="button">Stop</button><button onClick={() => void actions.onRecordDecision(selected.id, "expand", "Propose a limited rollout; no markets change automatically.")} type="button">Expand</button><button onClick={() => void actions.onSaveProcessDraft(selected.id)} type="button">Save process draft</button><button onClick={() => void actions.onCreatePartnerTask(selected.id)} type="button">Create partner task</button></footer></section> : null}
    <section className="panel table-panel programs__table-panel"><header><h2>Programs</h2><span>{rows.length} shown</span></header><div className="table-controls" aria-label="Program filters"><input aria-label="Find program" onChange={(event) => setQuery(event.target.value)} placeholder="Find program…" type="search" value={query} /><select aria-label="Type" onChange={(event) => setType(event.target.value as ProgramType)} value={type}>{(["All", "Experiment", "Campaign", "Sourcing", "Process"] as const).map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Status" onChange={(event) => setStatus(event.target.value as ProgramStatus)} value={status}>{(["All", "Running", "Review now", "Stopped"] as const).map((item) => <option key={item}>{item}</option>)}</select></div><div className="table-scroll"><table><thead><tr><th>Type</th><th>Program</th><th>Market</th><th>Brief</th><th>Implementation</th><th>Review</th><th>Goal</th><th>Results so far</th><th>Notes</th><th>Next step</th><th>Source</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><span className="status-tag">{typeLabel(row)}</span></td><th><button onClick={() => select(String(row.id))} type="button">{row.title}</button><small>{stageLabel(row.stage)}</small></th><td>{row.marketLabel}</td><td>{row.brief}</td><td>{formatDate(row.implementationAt)}</td><td>{formatDate(row.reviewAt)}</td><td>{goalLabel(row)}</td><td>{resultLabel(row)}</td><td><input aria-label={`Notes for ${row.title}`} onBlur={(event) => void actions.onSaveProgramText?.({ programId: row.id, field: "note", text: event.target.value })} onChange={(event) => updateDraft("note", String(row.id), event.target.value)} placeholder="Add note" value={notes[String(row.id)] ?? row.latestNote ?? ""} /></td><td><input aria-label={`Next step for ${row.title}`} onBlur={(event) => void actions.onSaveProgramText?.({ programId: row.id, field: "next-step", text: event.target.value })} onChange={(event) => updateDraft("next", String(row.id), event.target.value)} value={nextSteps[String(row.id)] ?? row.latestNextStep ?? row.nextStep} /></td><td>{row.workflowSource}</td></tr>)}</tbody></table></div></section>
    {confirmation ? <p aria-live="polite" className="programs__confirmation">{confirmation}</p> : null}
  </main>;
}
