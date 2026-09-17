import { useState } from "react";
import type { ReactNode } from "react";
import type { EvidenceBundle, WorkspaceNavigationTarget } from "../contracts/v2";

export interface EvidencePresentationProps {
  readonly evidence: EvidenceBundle;
  readonly onOpenWork: (target: WorkspaceNavigationTarget) => void;
}

/** Presents prepared evidence verbatim; all computation remains in the domain layer. */
export function EvidencePresentation({ evidence, onOpenWork }: EvidencePresentationProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-label={`Evidence for ${evidence.metric.id}`} className="v2-evidence">
      <p className="v2-evidence__finding">{evidence.explanation}</p>
      <button aria-expanded={expanded} onClick={() => setExpanded(!expanded)} type="button">Why this?</button>
      {expanded ? (
        <div className="v2-evidence__details">
          <p>
            <strong>Definition:</strong> {evidence.metric.id} ({evidence.metric.version}) · <strong>As of:</strong> {evidence.asOfAt} · <strong>Scope:</strong> {evidence.scope.populationDescription}
          </p>
          <p>
            <strong>Result:</strong> {evidence.computation.status === "available"
              ? `${evidence.computation.value} ${evidence.unit}`
              : `Unavailable — ${evidence.computation.reason}`}
          </p>
          {evidence.contributingRecords.length ? (
            <EvidenceTable contributingRecords={evidence.contributingRecords} />
          ) : <p>No contributing records were resolved for this result.</p>}
          <p><strong>Unknown information:</strong> {evidence.unknownCount}</p>
          {evidence.exclusions.length ? <ul>{evidence.exclusions.map((item) => <li key={`${item.record.kind}-${item.record.id}`}>{item.reason}</li>)}</ul> : null}
          {evidence.limitations.length ? <ul>{evidence.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul> : null}
          <button onClick={() => onOpenWork(evidence.navigationTarget)} type="button">Open the work</button>
        </div>
      ) : null}
    </section>
  );
}

function EvidenceTable({ contributingRecords }: Pick<EvidenceBundle, "contributingRecords">) {
  return (
    <div className="v2-table-wrap">
      <table>
        <caption>Contributing source records</caption>
        <thead><tr><th scope="col">Record</th><th scope="col">Type</th><th scope="col">Occurred</th><th scope="col">Evidence path</th></tr></thead>
        <tbody>{contributingRecords.map((record) => (
          <tr key={`${record.kind}-${record.id}`}>
            <td>{record.label}</td><td>{record.kind}</td><td>{record.occurredAt ?? "No occurrence time"}</td>
            <td>{record.joinPath.length ? record.joinPath.map((item) => `${item.kind}: ${item.id}`).join(" → ") : "Direct record"}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export interface MetricSignalProps {
  readonly label: string;
  readonly value: string;
  readonly status: string;
  readonly detail?: string;
  readonly children?: ReactNode;
}

export function MetricSignal({ label, value, status, detail, children }: MetricSignalProps) {
  return <section className="v2-metric-signal"><p>{label}</p><strong>{value}</strong><span>{status}</span>{detail ? <small>{detail}</small> : null}{children}</section>;
}

export function LoadingState({ label = "Loading prepared workspace data…" }: { readonly label?: string }) {
  return <p aria-live="polite" className="v2-state">{label}</p>;
}

export function ErrorState({ title = "This workspace could not be prepared.", detail }: { readonly title?: string; readonly detail?: string }) {
  return <section className="v2-state v2-state--error" role="alert"><strong>{title}</strong>{detail ? <span>{detail}</span> : null}</section>;
}

export function EmptyStateV2({ title, detail }: { readonly title: string; readonly detail: string }) {
  return <section className="v2-state"><strong>{title}</strong><span>{detail}</span></section>;
}
