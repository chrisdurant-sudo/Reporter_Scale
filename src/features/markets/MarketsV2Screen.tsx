import { useState } from "react";
import type { EvidenceBundle, WorkspaceNavigationTarget } from "../../contracts/v2";
import type { PreparedMarketsView, RequestCapacityAssessment } from "../../logic/capacity";

export interface MarketsV2ScreenProps {
  readonly view: PreparedMarketsView;
  readonly onSelectMarket: (marketId: string) => void;
  readonly onOpenEvidence: (target: WorkspaceNavigationTarget) => void;
  readonly onPreviewGoal: () => void;
  readonly onSaveGoal: () => void;
}

const label: Record<RequestCapacityAssessment["status"], string> = {
  confirmed: "Confirmed",
  "possible-match": "Possible match — unconfirmed",
  "no-verified-ready-match": "No verified ready match",
  "requirements-unknown": "Requirements need confirmation",
};

function WhyThis({ evidence, onOpenEvidence }: { evidence: EvidenceBundle; onOpenEvidence: (target: WorkspaceNavigationTarget) => void }) {
  const [open, setOpen] = useState(false);
  return <section className="markets-v2__evidence">
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>Why this?</button>
    {open ? <div>
      <p>{evidence.explanation}</p>
      <p>{evidence.computation.status === "available" ? String(evidence.computation.value) + " " + evidence.unit : evidence.computation.reason}</p>
      {evidence.contributingRecords.length ? <ul>{evidence.contributingRecords.map((record) => <li key={record.kind + record.id}>{record.label}</li>)}</ul> : <p>No contributing records.</p>}
      {evidence.exclusions.length ? <ul>{evidence.exclusions.map((item) => <li key={item.record.kind + item.record.id}>{item.reason}</li>)}</ul> : null}
      {evidence.unknownCount ? <p>{evidence.unknownCount} unknown item{evidence.unknownCount === 1 ? "" : "s"}.</p> : null}
      {evidence.limitations.map((item) => <p key={item}>Limit: {item}</p>)}
      <button type="button" onClick={() => onOpenEvidence(evidence.navigationTarget)}>Open the work</button>
    </div> : null}
  </section>;
}

export function MarketsV2Screen({ view, onSelectMarket, onOpenEvidence, onPreviewGoal, onSaveGoal }: MarketsV2ScreenProps) {
  const { coverage } = view;
  return <main className="markets-v2" aria-label="Markets capacity">
    <header>
      <p>Independent synthetic demo · Upcoming work at {view.evaluation.asOfAt}</p>
      <h1>Where do we need more capacity?</h1>
      <p>{coverage.requested} requested slots · {coverage.confirmed} confirmed · {coverage.possible} possible options · {coverage.noVerifiedReadyMatch} with no verified ready match</p>
    </header>

    <section aria-label="Market comparison">
      <h2>Market comparison</h2>
      <table>
        <thead><tr><th>Market</th><th>Requested</th><th>Confirmed</th><th>Unresolved</th><th>Issue</th><th>Next action</th></tr></thead>
        <tbody>{view.marketRows.map((row) => <tr key={row.marketId}>
          <th scope="row"><button type="button" onClick={() => onSelectMarket(row.marketId)}>{row.marketName}</button></th>
          <td>{row.coverage.requested}</td><td>{row.coverage.confirmed}</td><td>{row.coverage.requested - row.coverage.confirmed}</td>
          <td>{row.issue}</td><td>{row.nextAction}</td>
        </tr>)}</tbody>
      </table>
    </section>

    <section aria-label="Upcoming request coverage">
      <h2>Upcoming demand and coverage</h2>
      <p>Possible matches are candidate options, not guaranteed simultaneously fillable capacity.</p>
      <ul>{view.requests.map((item) => <li key={item.request.id}>
        <strong>{String(item.request.id)}:</strong> {label[item.status]}
        {item.invalidAcceptanceReasons.length ? <span> Acceptance review: {item.invalidAcceptanceReasons.join(" ")}</span> : null}
        {item.reasons.length ? <span> {item.reasons.join(" ")}</span> : null}
        {item.status === "possible-match" ? <ul>{item.candidates.filter((candidate) => candidate.eligible).map((candidate) => <li key={candidate.reporterId}>
          {candidate.reporterName}{candidate.sharedRequestIds.length > 1 ? " — also a possible option for " + candidate.sharedRequestIds.filter((id) => id !== item.request.id).join(", ") : ""}
        </li>)}</ul> : null}
      </li>)}</ul>
    </section>

    <section aria-label="Requirements breakdown">
      <h2>Requirements breakdown</h2>
      <table><thead><tr><th>Dimension</th><th>Requirement</th><th>Requested</th><th>Confirmed</th><th>Possible</th><th>Unresolved</th></tr></thead>
        <tbody>{view.requirementBreakdown.map((row) => <tr key={row.kind + row.value}><td>{row.kind}</td><td>{row.value}</td><td>{row.requested}</td><td>{row.confirmed}</td><td>{row.possible}</td><td>{row.unresolved}</td></tr>)}</tbody>
      </table>
    </section>

    {view.growthGoal ? <section aria-label="Growth goal">
      <h2>Growth goal</h2>
      <p>{view.growthGoal.actual} of {view.growthGoal.target} first-time readiness additions. Baseline: {view.growthGoal.baselineAsOfAt}; deadline: {view.growthGoal.deadline}.</p>
      <p>Changing a goal cannot change readiness, coverage, or job outcomes.</p>
      <button type="button" onClick={onPreviewGoal}>Preview goal revision</button>
      <button type="button" onClick={onSaveGoal}>Save goal revision</button>
    </section> : null}

    <section aria-label="Original plan results">
      <h2>Original-plan results</h2>
      {view.originalPlan.status === "available" ? <p>{view.originalPlan.completedRequests} completed request{view.originalPlan.completedRequests === 1 ? "" : "s"} and {view.originalPlan.firstJobs} first job{view.originalPlan.firstJobs === 1 ? "" : "s"} from the frozen request set.</p> : <p>{view.originalPlan.limitation}</p>}
    </section>

    <section aria-label="Evidence">
      <h2>Evidence</h2>
      {view.evidence.map((evidence) => <WhyThis key={evidence.id} evidence={evidence} onOpenEvidence={onOpenEvidence} />)}
    </section>
    {view.limitations.map((item) => <p key={item}>Limit: {item}</p>)}
  </main>;
}
