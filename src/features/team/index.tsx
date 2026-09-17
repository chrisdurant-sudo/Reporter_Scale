import { useState } from "react";
import type {
  EvidenceBundleId,
  TeamCoachingRecordPayload,
  TeamCoachingReviewPayload,
  TeamPracticeSharePayload,
  TeamQualityRecordPayload,
  TeamTargetSaveRevisionPayload,
  WorkAssignPayload,
} from "../../contracts/v2";
import type { PreparedTeamView } from "../../logic/team";

export interface TeamScreenProps {
  readonly view: PreparedTeamView;
  /** Integration owns command envelopes, revision handling, and persistence. */
  readonly actions: {
    readonly onOpenEvidence: (evidenceId: EvidenceBundleId) => void;
    readonly onReassignWork: (payload: WorkAssignPayload) => Promise<void>;
    readonly onSaveTargetRevision: (payload: TeamTargetSaveRevisionPayload) => Promise<void>;
    readonly onRecordQuality: (payload: TeamQualityRecordPayload) => Promise<void>;
    readonly onRecordCoaching: (payload: TeamCoachingRecordPayload) => Promise<void>;
    readonly onReviewCoaching: (payload: TeamCoachingReviewPayload) => Promise<void>;
    readonly onSharePractice: (payload: TeamPracticeSharePayload) => Promise<void>;
  };
}

function date(value: string | null): string { return value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "Unknown due date"; }

/** Prepared-data-only Team surface. Integration supplies command construction and persistence. */
export function TeamScreen({ view, actions }: TeamScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const member = view.members.find((item) => item.id === selected) ?? null;
  return <section aria-labelledby="team-heading" data-testid="team-screen">
    <header><p>Team workspace</p><h2 id="team-heading">What is holding up the team&apos;s work?</h2><p>Workload, inspected samples, and specific support actions—not a performance ranking.</p></header>
    <p><strong>{view.unownedOpenWork.length}</strong> unowned open work items need an explicit owner.</p>
    <div role="region" aria-label="Team roster"><table><caption>Role-specific workload and inspected quality</caption><thead><tr><th>Team member</th><th>Completed / like-role target</th><th>Total open / selected market</th><th>Overdue</th><th>Quality sample</th></tr></thead><tbody>{view.members.map((row) => <tr key={row.id}><th scope="row"><button type="button" onClick={() => setSelected(row.id)}>{row.name}</button><small> {row.role}</small></th><td>{row.completed.completed} / {row.completed.target ?? "No target"}<small> {row.completed.note}</small></td><td>{row.totalOpenWorkload} total / {row.selectedMarketOpenWorkload} selected-market</td><td>{row.overdueWorkload}{row.unknownDueWorkload ? ` · ${row.unknownDueWorkload} unknown due` : ""}</td><td>{row.quality.ratio === null ? "No inspected work" : `${row.quality.passedCount}/${row.quality.inspectedCount} passed`}</td></tr>)}</tbody></table></div>
    {member ? <aside aria-label={`${member.name} work detail`}><h3>{member.name}</h3><p>Total workload and selected-market workload are shown separately.</p><h4>Open work</h4><ul>{member.workItems.map((work) => <li key={work.id}>{work.label} · {work.currentStatus} · {date(work.dueAt)}{work.isOverdue ? " · overdue" : ""}</li>)}</ul><h4>Cycle-time samples</h4><p>These are observed case durations and still-waiting ages, not a composite score.</p><ul>{member.cycleTime.completedSamples.map((sample) => <li key={`completed-${sample.workItemId}`}>{sample.label} · completed in {sample.elapsedHours} hours</li>)}{member.cycleTime.waitingSamples.map((sample) => <li key={`waiting-${sample.workItemId}`}>{sample.label} · waiting {sample.ageHours} hours</li>)}</ul><h4>Inspected quality sample</h4>{member.quality.sample.length ? <ul>{member.quality.sample.map((sample) => <li key={sample.workItemId}>{sample.label} · {sample.passed ? "passed" : "needs follow-up"} · inspected {date(sample.checkedAt)}</li>)}</ul> : <p>No inspected work is represented as a quality result.</p>}<h4>Coaching and practice sharing</h4><ul>{member.coachingActions.map((action) => <li key={action.id}><strong>{action.observedIssueOrStrength}</strong> · Expected: {action.expectedPractice} · Next: {action.nextAction} · Review {date(action.reviewAt)}{action.outcomeNote ? ` · ${action.outcomeNote}` : ""}</li>)}</ul><p>Integration supplies the typed Team command callbacks for reassignment, targets, inspection, coaching/review, and positive-practice sharing.</p></aside> : null}
    <details><summary>Evidence and limitations</summary><ul>{view.limitations.map((item) => <li key={item}>{item}</li>)}</ul>{view.evidence.map((item) => <button type="button" key={item.id} onClick={() => actions.onOpenEvidence(item.id)}>Open evidence: {item.explanation}</button>)}</details>
  </section>;
}
