import { useEffect, useMemo, useRef, useState } from "react";
import type { ActionResult, OutreachPreview, ReporterDetailView, ReporterRowView, ReportersScreenProps, SaveCoachingInput, SaveScreeningInput, ScreeningCheckStatus, ScreeningOutcome, UpdateFollowUpInput } from "../../contracts";
import { TEST_ANCHORS } from "../../contracts";
import { Button, DetailPanel, EmptyState, Notice } from "../../ui";
import "./reporters.css";

const outcomes: { value: ScreeningOutcome; label: string }[] = [{ value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "needs-information", label: "Needs information" }, { value: "closed", label: "Closed" }];
const checkStatuses: { value: ScreeningCheckStatus; label: string }[] = [{ value: "not-reviewed", label: "Not reviewed" }, { value: "complete", label: "Complete" }, { value: "needs-information", label: "Needs information" }];
const dateInput = (value: string) => value.slice(0, 10);
function dateLabel(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date); }
function message<T>(result: ActionResult<T>) { return result.ok ? result.message : result.errors.map((error) => error.message).join(" ") || result.message; }
function statusClass(tone: ReporterRowView["tone"]) { return `reporters__status reporters__status--${tone}`; }
type Feedback = { text: string; tone: "success" | "danger" };
function feedbackFor<T>(result: ActionResult<T>): Feedback { return { text: message(result), tone: result.ok ? "success" : "danger" }; }
function matchingRows(rows: ReportersScreenProps["view"]["reporters"], search: string) { const term = search.trim().toLowerCase(); return term ? rows.filter((reporter) => [reporter.name, reporter.marketLabel, reporter.stageLabel, reporter.blocker, reporter.nextStep, reporter.assignedTo].join(" ").toLowerCase().includes(term)) : rows; }

function ReporterDetails({ detail, actions, people }: { detail: ReporterDetailView; actions: ReportersScreenProps["actions"]; people: ReportersScreenProps["view"]["teamMemberOptions"] }) {
  const [checks, setChecks] = useState(detail.checks);
  const [outcome, setOutcome] = useState<ScreeningOutcome>(detail.screeningOutcome as ScreeningOutcome);
  const [reason, setReason] = useState(detail.screeningReason);
  const [unresolved, setUnresolved] = useState(detail.unresolvedInformation.join("\n"));
  const [nextStep, setNextStep] = useState(detail.nextStep);
  const [assignedTo, setAssignedTo] = useState(detail.assignedTeamMemberId || people[0]?.id || "");
  const [dueAt, setDueAt] = useState(dateInput(detail.dueAt));
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<OutreachPreview | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState<"screening" | "follow-up" | null>(null);
  async function saveScreening() {
    setBusy("screening");
    const input: SaveScreeningInput = { reporterId: detail.id, checks, unresolvedInformation: unresolved.split("\n").map((entry) => entry.trim()).filter(Boolean), reason, outcome, reviewerId: people[0]?.id ?? "" };
    const result = await actions.onSaveScreening(input); setFeedback(feedbackFor(result)); setBusy(null);
  }
  async function saveFollowUp() {
    setBusy("follow-up");
    const input: UpdateFollowUpInput = { reporterId: detail.id, followUpId: detail.followUpId ?? undefined, nextStep, assignedTeamMemberId: assignedTo, dueAt: dueAt ? `${dueAt}T17:00:00.000Z` : "", state: "open", note };
    const result = await actions.onUpdateFollowUp(input); setFeedback(feedbackFor(result)); setBusy(null);
  }
  function previewOutreach() { const result = actions.onPreviewOutreach(detail.id); if (result.ok) setPreview(result.value); setFeedback(feedbackFor(result)); }
  return <div className="reporters__detail-content">
    <p className="reporters__detail-intro">{detail.marketLabel} · serves {detail.serviceMarketsLabel} · Found through {detail.foundThrough}</p>
    <dl className="reporters__facts"><div><dt>Current stage</dt><dd>{detail.stageLabel}</dd></div><div><dt>Blocker</dt><dd>{detail.blocker}</dd></div></dl>
    <section><h3>Preferences</h3><dl className="reporters__preferences">{detail.preferences.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>
    <section className="reporters__form-section"><h3>Screening</h3><p>Record sample checks and the reason for this review. This does not make an eligibility decision.</p><div className="reporters__checks">{checks.map((check, index) => <label key={check.id} className="reporters__check"><span>{check.label}{check.required ? " (required)" : ""}</span><select value={check.status} onChange={(event) => setChecks((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value as ScreeningCheckStatus } : item))}>{checkStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{check.note ? <small>{check.note}</small> : null}</label>)}</div>
      <label>Review outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as ScreeningOutcome)}>{outcomes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} /></label><label>Information still needed<textarea value={unresolved} onChange={(event) => setUnresolved(event.target.value)} rows={2} placeholder="One item per line" /></label><Button type="button" variant="secondary" busy={busy === "screening"} onClick={() => void saveScreening()}>Save screening review</Button></section>
    <section className="reporters__form-section"><h3>Follow-up</h3><label>Next step<input value={nextStep} onChange={(event) => setNextStep(event.target.value)} /></label><label>Assigned to<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Due<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label><label>Update note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} /></label><div className="reporters__action-row"><Button type="button" busy={busy === "follow-up"} onClick={() => void saveFollowUp()}>Save follow-up</Button><Button type="button" variant="secondary" onClick={previewOutreach}>Preview message</Button></div>{preview ? <Notice tone="info" title="Preview only — no message will be sent."><p>To: {preview.recipientLabel}</p><p>Subject: {preview.subject}</p><p>{preview.body}</p></Notice> : null}</section>
    {feedback ? <Notice tone={feedback.tone} title={feedback.tone === "danger" ? "Could not save reporter work" : "Reporter work saved"}>{feedback.text}</Notice> : null}<section><h3>History</h3><ol className="reporters__history">{detail.history.map((event) => <li key={event.id}><strong>{event.label}</strong><span>{dateLabel(event.occurredAt)} · {event.author}</span><p>{event.reason}</p></li>)}</ol></section>
  </div>;
}

export function ReportersScreen({ view, actions, initialReporterId = null }: ReportersScreenProps) {
  const [search, setSearch] = useState(""); const [selectedId, setSelectedId] = useState<string | null>(initialReporterId); const focusRef = useRef<HTMLButtonElement>(null); const [coachingMember, setCoachingMember] = useState<string | null>(null); const [coachingReporter, setCoachingReporter] = useState(""); const [coachingFeedback, setCoachingFeedback] = useState<Feedback | null>(null); const [coachingBusy, setCoachingBusy] = useState(false);
  const rows = useMemo(() => matchingRows(view.reporters, search), [search, view.reporters]);
  const detail = rows.some((row) => row.id === selectedId) ? view.reporterDetails.find((item) => item.id === selectedId) ?? null : null;
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedId(null); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  function close() { setSelectedId(null); window.setTimeout(() => focusRef.current?.focus(), 0); }
  function updateSearch(value: string) { if (selectedId && !matchingRows(view.reporters, value).some((row) => row.id === selectedId)) setSelectedId(null); setSearch(value); }
  async function saveCoaching(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const input: SaveCoachingInput = { teamMemberId: String(form.get("teamMemberId") ?? ""), reporterId: coachingReporter || null, note: String(form.get("note") ?? ""), nextAction: String(form.get("nextAction") ?? ""), dueAt: `${String(form.get("dueAt") ?? "")}T17:00:00.000Z` }; setCoachingBusy(true); const result = await actions.onSaveCoaching(input); setCoachingFeedback(feedbackFor(result)); setCoachingBusy(false); }
  if (view.status === "loading") return <section className="reporters" data-testid={TEST_ANCHORS.reportersScreen}><h2>Reporters</h2><p>{view.statusMessage}</p></section>;
  if (view.status === "error") return <section className="reporters" data-testid={TEST_ANCHORS.reportersScreen}><h2>Reporters</h2><Notice tone="danger">{view.statusMessage}</Notice></section>;
  return <section className="reporters" data-testid={TEST_ANCHORS.reportersScreen}>
    <header className="reporters__header"><div><h2>Reporter work</h2><p>{view.marketLabel} · {view.asOfLabel}</p></div><p>{view.populationNote}</p></header>
    <section aria-label="Current stage snapshot" className="reporters__stage-strip"><h3>Current stage snapshot</h3><p>Counts show current work, not a conversion rate.</p><div>{view.stages.map((stage) => <article key={stage.stage}><strong>{stage.count}</strong><span>{stage.label}</span><small>{stage.note}</small></article>)}</div></section>
    <div className="reporters__workspace"><section className="reporters__list-section"><div className="reporters__list-header"><div><h3>Working list</h3><p>Recruiting-market ownership determines this list.</p></div><label className="reporters__search">Search reporter work<input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Name, blocker, owner…" /></label></div>{rows.length === 0 ? <EmptyState title="No matching reporter work" description="Try another name, blocker, stage, or market." /> : <div className="reporters__table-wrap"><table><thead><tr><th scope="col">Reporter</th><th scope="col">Stage</th><th scope="col">Blocker</th><th scope="col">Next step</th><th scope="col">Assigned to</th><th scope="col">Due</th></tr></thead><tbody>{rows.map((reporter) => <tr key={reporter.id}><th scope="row"><button data-testid={`reporter-row-${reporter.id}`} ref={selectedId === reporter.id ? focusRef : undefined} type="button" className="reporters__row-button" onClick={() => setSelectedId(reporter.id)}>{reporter.name}<small>{reporter.marketLabel} · waiting {reporter.waitDays} days</small></button></th><td><span className={statusClass(reporter.tone)}>{reporter.stageLabel}</span></td><td>{reporter.blocker}</td><td>{reporter.nextStep}</td><td>{reporter.assignedTo}</td><td>{dateLabel(reporter.dueAt)}</td></tr>)}</tbody></table></div>}</section>
      <section className="reporters__team"><h3>Team workload & coaching</h3><p>Use this to clarify work and support people, not to rank them.</p><div className="reporters__workload-list">{view.teamWorkload.map((member) => <article key={member.teamMemberId}><h4>{member.name}</h4><p>{member.openFollowUps} open follow-ups · {member.overdueFollowUps} overdue</p><p>{member.workloadNote}</p>{member.coachingNotes.map((note) => <p className="reporters__coaching-note" key={note.id}><strong>Next:</strong> {note.nextAction} · due {dateLabel(note.dueAt)}</p>)}<Button type="button" variant="quiet" onClick={() => setCoachingMember(member.teamMemberId)}>Add coaching note</Button></article>)}</div>
      {coachingMember ? <form className="reporters__coaching-form" onSubmit={(event) => void saveCoaching(event)}><h4>Add coaching or clarification</h4><label>Team member<select name="teamMemberId" defaultValue={coachingMember}>{view.teamMemberOptions.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Linked reporter (optional)<select value={coachingReporter} onChange={(event) => setCoachingReporter(event.target.value)}><option value="">No specific reporter</option>{view.reporters.map((reporter) => <option key={reporter.id} value={reporter.id}>{reporter.name}</option>)}</select></label><label>Note<textarea name="note" required rows={2} /></label><label>Next action<input name="nextAction" required /></label><label>Due<input name="dueAt" type="date" required /></label><div className="reporters__action-row"><Button type="submit" busy={coachingBusy}>Save coaching note</Button><Button type="button" variant="secondary" onClick={() => setCoachingMember(null)}>Cancel</Button></div>{coachingFeedback ? <Notice tone={coachingFeedback.tone} title={coachingFeedback.tone === "danger" ? "Could not save coaching note" : "Coaching note saved"}>{coachingFeedback.text}</Notice> : null}</form> : null}</section></div>
    {detail ? <DetailPanel open title={detail.name} onClose={close} returnFocusRef={focusRef} testId={TEST_ANCHORS.reporterDetail}><ReporterDetails key={detail.id} detail={detail} actions={actions} people={view.teamMemberOptions} /></DetailPanel> : null}
  </section>;
}
