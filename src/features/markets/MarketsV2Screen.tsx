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

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
function SupplyDemandChart({ view, projection }: { readonly view: PreparedMarketsView; readonly projection: boolean }) {
  const series = view.supplyDemandSeries;
  if (!series || !series.points.length) return <p className="chart-empty">No source-backed supply and demand history is available in this scope.</p>;
  const points = projection ? series.points : series.points.filter((point) => point.phase === "historical");
  const maximum = Math.max(1, ...points.flatMap((point) => [point.availableSupply, point.demand, point.neededSupply]));
  const path = (key: "availableSupply" | "demand" | "neededSupply") => points.map((point, index) => `${index * (100 / Math.max(1, points.length - 1))},${100 - (point[key] / maximum) * 86}`).join(" ");
  const boundary = points.findIndex((point) => point.at === series.forecastBoundaryAt);
  return <figure className="rg-chart" aria-label="Supply, demand, and needed supply over time"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Supply, demand, and needed supply. Scale 0 to ${maximum}.`}><line className="rg-chart__grid" x1="0" x2="100" y1="14" y2="14" /><line className="rg-chart__grid" x1="0" x2="100" y1="57" y2="57" />{boundary >= 0 ? <line className="rg-chart__boundary" x1={`${boundary * (100 / Math.max(1, points.length - 1))}`} x2={`${boundary * (100 / Math.max(1, points.length - 1))}`} y1="0" y2="100" /> : null}<polyline className="rg-chart__line rg-chart__line--supply" points={path("availableSupply")} /><polyline className="rg-chart__line rg-chart__line--demand" points={path("demand")} /><polyline className="rg-chart__line rg-chart__line--need" points={path("neededSupply")} /></svg><figcaption><span>0–{maximum} people</span><span>{points.map((point) => dateLabel(point.at)).join(" · ")}</span></figcaption></figure>;
}

export function MarketsV2Screen({ view, onSelectMarket, onOpenEvidence, onPreviewGoal, onSaveGoal }: MarketsV2ScreenProps) {
  const [projection, setProjection] = useState(true); const { coverage } = view; const attention = view.marketRows.filter((row) => row.coverage.requested > row.coverage.confirmed).slice(0, 3);
  return <main className="workspace overview" aria-label="Overview"><section className="kpi-strip" aria-label="Overview metrics"><div><span>Markets</span><strong>{view.marketRows.length}</strong></div><div><span>Available reporters</span><strong>{coverage.confirmed}</strong></div><div><span>Open jobs</span><strong>{coverage.requested}</strong></div><div><span>Additional need</span><strong>{coverage.requested - coverage.confirmed}</strong></div></section><div className="workspace-controls" aria-label="Overview controls"><button className="is-active" type="button">Trends</button><button type="button">Overview</button><button aria-pressed={projection} onClick={() => setProjection((value) => !value)} type="button">Projection {projection ? "on" : "off"}</button></div><section className="attention-chart"><section className="panel attention"><header><h2>What needs attention</h2><span>{attention.length} items</span></header><ol>{attention.map((row, index) => <li key={row.marketId}><b>{index + 1}</b><div><strong>{row.issue}</strong><button onClick={() => onSelectMarket(row.marketId)} type="button">{row.nextAction}</button></div></li>)}</ol></section><section className="panel chart-card"><header><div><h2>Supply and demand</h2><p>Available supply, scheduled demand, and needed supply</p></div><div className="chart-legend"><span>Supply</span><span>Demand</span><span>Needed supply</span></div></header><SupplyDemandChart view={view} projection={projection} /></section></section><section className="overview-summaries" aria-label="Connected summaries">{["Markets", "Funnel", "Team", "Programs"].map((name) => <section className="panel" key={name}><span>{name}</span><strong>{name === "Markets" ? `${coverage.requested} open jobs` : "Open the workspace"}</strong></section>)}</section><section className="panel table-panel" aria-label="Market comparison"><header><h2>Market comparison</h2></header><div className="table-scroll"><table><thead><tr><th>Market</th><th>Supply</th><th>Demand</th><th>Gap</th><th>Next step</th></tr></thead><tbody>{view.marketRows.map((row) => <tr key={row.marketId}><th><button onClick={() => onSelectMarket(row.marketId)} type="button">{row.marketName}</button></th><td>{row.coverage.confirmed}</td><td>{row.coverage.requested}</td><td>{row.coverage.requested - row.coverage.confirmed}</td><td>{row.nextAction}</td></tr>)}</tbody></table></div></section><section className="overview-goal panel"><header><h2>Growth goal</h2></header><p>{view.growthGoal ? `${view.growthGoal.actual} of ${view.growthGoal.target} first-time readiness additions.` : "No growth-goal revision is saved for this market yet."}</p><div><button onClick={onPreviewGoal} type="button">Preview goal revision</button><button onClick={onSaveGoal} type="button">Save goal revision</button></div></section>{view.evidence[0] ? <button className="why-this" onClick={() => onOpenEvidence(view.evidence[0]!.navigationTarget)} type="button">Why this?</button> : null}</main>;
  /* Legacy presentation remains below solely to preserve the public source diff until the next cleanup. */
  return <main className="workspace markets-v2" aria-label="Overview">
    <section className="kpi-strip" aria-label="Overview metrics"><div><span>Markets</span><strong>{view.marketRows.length}</strong><small>In view</small></div><div><span>Available reporters</span><strong>{coverage.confirmed}</strong><small>Confirmed coverage</small></div><div><span>Open jobs</span><strong>{coverage.requested}</strong><small>Upcoming work</small></div><div><span>Additional need</span><strong>{coverage.requested - coverage.confirmed}</strong><small>Projected gap</small></div></section>
    <div className="workspace-controls"><button className="is-active" type="button">Trends</button><button type="button">Overview</button><button aria-pressed="true" type="button">Projection on</button></div>
    <section className="attention-chart"><div className="panel attention"><header><h2>What needs attention</h2><span className="status-tag status-tag--over">{coverage.requested - coverage.confirmed} open</span></header><ul>{view.marketRows.slice(0, 3).map((row) => <li key={row.marketId}><strong>{row.marketName}</strong><span>{row.issue}</span><button onClick={() => onSelectMarket(row.marketId)} type="button">{row.nextAction}</button></li>)}</ul></div><section className="panel chart-card"><header><div><h2>Supply and demand</h2><p>Upcoming work</p></div><div className="chart-legend"><span>Supply</span><span>Demand</span><span>Needed supply</span></div></header><div className="line-chart">{view.marketRows.slice(0, 5).map((row, index) => <div className="chart-row" key={row.marketId}><span>{row.marketId}</span><i style={{ width: `${Math.max(12, row.coverage.confirmed * 15)}%` }} /><b style={{ left: `${Math.min(86, 20 + index * 15)}%` }} /></div>)}<em>Forecast boundary</em></div></section></section>

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

    <section aria-label="Growth goal">
      <h2>Growth goal</h2>
      {view.growthGoal ? <p>{view.growthGoal?.actual} of {view.growthGoal?.target} first-time readiness additions. Baseline: {view.growthGoal?.baselineAsOfAt}; deadline: {view.growthGoal?.deadline}.</p> : <p>No growth-goal revision is saved for this market yet. Preview or save the dated goal revision to record the plan.</p>}
      <p>Changing or saving a goal cannot change readiness, coverage, or job outcomes.</p>
      <button type="button" onClick={onPreviewGoal}>Preview goal revision</button>
      <button type="button" onClick={onSaveGoal}>Save goal revision</button>
    </section>

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
