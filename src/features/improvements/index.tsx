import { useState } from "react";
import type { ActionResult, ImprovementCardView, ImprovementDecisionKind, ImprovementsScreenProps, ProcessDraftStep } from "../../contracts";
import { TEST_ANCHORS } from "../../contracts";
import { Button, EmptyState, Notice } from "../../ui";
import "./improvements.css";

type DecisionDraft = { decision: ImprovementDecisionKind; rationale: string };
type ProcessDraftForm = { title: string; ownerId: string; trigger: string; steps: ProcessDraftStep[] };
const decisionLabels: Record<ImprovementDecisionKind, string> = { continue: "Continue", change: "Change", stop: "Stop" };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function defaultProcessForm(card: ImprovementCardView): ProcessDraftForm {
  if (card.processDraft) return { title: card.processDraft.title, ownerId: card.processDraft.ownerId, trigger: card.processDraft.trigger, steps: card.processDraft.steps };
  return { title: `${card.title} process`, ownerId: card.ownerId, trigger: "When a reporter reaches this step", steps: [{ id: `${card.id}-step-1`, order: 1, instruction: "Document the agreed next step." }] };
}

export function ImprovementsScreen({ view, actions }: ImprovementsScreenProps) {
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, DecisionDraft>>({});
  const [processForms, setProcessForms] = useState<Record<string, ProcessDraftForm>>({});
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (view.status === "empty") return <section className="improvements-screen" data-testid={TEST_ANCHORS.improvementsScreen}><h2>Improvements</h2><EmptyState title="No improvement records" description={view.statusMessage} /></section>;

  return (
    <section className="improvements-screen" data-testid={TEST_ANCHORS.improvementsScreen} aria-busy={view.status === "loading"}>
      <header className="improvements-screen__header"><div><p className="improvements-screen__eyebrow">Process learning</p><h2>Improvements</h2><p>{view.statusMessage}</p></div><p className="improvements-screen__scope">{view.selectedMarket === "ALL" ? "All markets" : `${view.selectedMarket} records`}</p></header>
      {actionResult ? <Notice tone={actionResult.ok ? "success" : "danger"} title={actionResult.ok ? "Saved" : "Could not save"}>{actionResult.message}</Notice> : null}
      {view.status === "error" ? <Notice tone="danger" title="Could not load improvements">{view.statusMessage}</Notice> : null}
      <div className="improvements-list">{view.improvements.map((card) => <ImprovementCard key={card.id} card={card} decisionDraft={decisionDrafts[card.id] ?? { decision: card.currentDecision ?? "continue", rationale: card.currentDecision ? card.decisionRationale : "" }} processForm={processForms[card.id] ?? defaultProcessForm(card)} teamMembers={view.teamMemberOptions} busy={busyId === card.id} onDecisionDraft={(draft) => setDecisionDrafts((current) => ({ ...current, [card.id]: draft }))} onProcessForm={(form) => setProcessForms((current) => ({ ...current, [card.id]: form }))} onSaveDecision={async () => { const draft = decisionDrafts[card.id] ?? { decision: card.currentDecision ?? "continue", rationale: card.currentDecision ? card.decisionRationale : "" }; setBusyId(card.id); const result = await actions.onRecordDecision({ improvementId: card.id, ...draft }); setBusyId(null); setActionResult(result); }} onSaveProcess={async () => { const form = processForms[card.id] ?? defaultProcessForm(card); setBusyId(card.id); const result = card.processDraft ? await actions.onUpdateProcessDraft({ draftId: card.processDraft.id, ...form }) : await actions.onCreateProcessDraft({ improvementId: card.id, ...form }); setBusyId(null); setActionResult(result); }} />)}</div>
      <WeeklyReview review={view.weeklyReview} />
    </section>
  );
}

interface ImprovementCardProps { card: ImprovementCardView; decisionDraft: DecisionDraft; processForm: ProcessDraftForm; teamMembers: ImprovementsScreenProps["view"]["teamMemberOptions"]; busy: boolean; onDecisionDraft(draft: DecisionDraft): void; onProcessForm(form: ProcessDraftForm): void; onSaveDecision(): Promise<void>; onSaveProcess(): Promise<void>; }

function ImprovementCard({ card, decisionDraft, processForm, teamMembers, busy, onDecisionDraft, onProcessForm, onSaveDecision, onSaveProcess }: ImprovementCardProps) {
  const decisionIsContinue = card.currentDecision === "continue";
  const editableForm = processForm;
  const updateStep = (index: number, instruction: string) => onProcessForm({ ...editableForm, steps: editableForm.steps.map((step, current) => current === index ? { ...step, instruction } : step) });
  return <article className="improvement-card" aria-labelledby={`${card.id}-title`}>
    <header className="improvement-card__header"><div><p className="improvement-card__type">{card.changeTypeLabel} · {card.marketLabel}</p><h3 id={`${card.id}-title`}>{card.title}</h3></div><span className="improvement-card__decision">{card.currentDecision ? decisionLabels[card.currentDecision] : "Decision needed"}</span></header>
    <div className="improvement-card__context"><p><strong>Hypothesis:</strong> {card.hypothesis}</p><p><strong>Change:</strong> {card.changeSummary}</p><dl><div><dt>Owner</dt><dd>{card.ownerName}</dd></div><div><dt>Partner deliverable</dt><dd>{card.partnerDeliverable}</dd></div><div><dt>Review date</dt><dd>{dateLabel(card.reviewAt)}</dd></div><div><dt>Observation window</dt><dd>{card.observationWindowLabel}</dd></div></dl></div>
    <section className="improvement-card__evidence" aria-label="Descriptive results"><h4>What the sample shows</h4><p className="improvement-card__note">Descriptive sample results only; they do not establish a causal winner.</p><div className="improvement-card__results">{card.results.map((result) => <div key={result.label} className="improvement-result"><strong>{result.label}</strong><span>{result.rateLabel} · {result.completedCount} of {result.reporterCount}</span><span>{result.observationComplete ? "Observation complete" : "Not enough results yet"}</span><small>{result.note}</small></div>)}</div><div className="improvement-card__limitations"><h4>Limits to keep in view</h4><ul>{card.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div></section>
    <section className="improvement-card__decision-form" aria-label={`Decision for ${card.title}`}><h4>Record a decision</h4><div className="improvement-card__choices" role="radiogroup" aria-label="Decision">{(Object.keys(decisionLabels) as ImprovementDecisionKind[]).map((decision) => <label key={decision}><input type="radio" name={`${card.id}-decision`} value={decision} checked={decisionDraft.decision === decision} onChange={() => onDecisionDraft({ ...decisionDraft, decision })} />{decisionLabels[decision]}</label>)}</div><label className="improvement-card__field">Rationale (required)<textarea value={decisionDraft.rationale} onChange={(event) => onDecisionDraft({ ...decisionDraft, rationale: event.target.value })} placeholder="Explain the decision and the next review." rows={3} /></label><Button type="button" variant="secondary" busy={busy} disabled={!decisionDraft.rationale.trim()} onClick={() => void onSaveDecision()}>Save decision</Button>{card.currentDecision ? <p className="improvement-card__recorded">Current record: {decisionLabels[card.currentDecision]} — {card.decisionRationale}</p> : null}</section>
    {card.canSaveAsProcess && decisionIsContinue ? <section className="improvement-card__process" aria-label={`Draft process for ${card.title}`}><h4>{card.processDraft ? "Editable process draft" : "Save as process"}</h4><p>{card.processDraft ? "This remains a draft; editing it does not roll out a process." : "Available after a Continue decision. This creates a draft, not a rollout."}</p><label className="improvement-card__field">Draft title<input value={editableForm.title} onChange={(event) => onProcessForm({ ...editableForm, title: event.target.value })} /></label><label className="improvement-card__field">Owner<select value={editableForm.ownerId} onChange={(event) => onProcessForm({ ...editableForm, ownerId: event.target.value })}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label className="improvement-card__field">Trigger<input value={editableForm.trigger} onChange={(event) => onProcessForm({ ...editableForm, trigger: event.target.value })} /></label>{editableForm.steps.map((step, index) => <label className="improvement-card__field" key={step.id}>Step {step.order}<input value={step.instruction} onChange={(event) => updateStep(index, event.target.value)} /></label>)}<Button type="button" busy={busy} disabled={!editableForm.title.trim() || !editableForm.trigger.trim() || editableForm.steps.some((step) => !step.instruction.trim())} onClick={() => void onSaveProcess()}>{card.processDraft ? "Save draft changes" : "Save as process"}</Button></section> : null}
  </article>;
}

function WeeklyReview({ review }: { review: ImprovementsScreenProps["view"]["weeklyReview"] }) {
  return <section className="weekly-review" aria-labelledby="weekly-review-heading"><p className="improvements-screen__eyebrow">Record-backed review</p><h3 id="weekly-review-heading">Weekly review · {review.windowLabel}</h3><p>{review.summary}</p><dl>{review.evidence.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd><small>Records: {item.sourceRecordIds.join(", ")}</small></div>)}</dl><h4>Next actions</h4><ul>{review.nextActions.map((action, index) => <li key={`${action}-${index}`}>{action}</li>)}</ul></section>;
}
