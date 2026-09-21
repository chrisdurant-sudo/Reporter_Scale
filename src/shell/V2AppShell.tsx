import { Drawer } from "../ui/interview";
import { displayDate, displayDateRange } from "../ui/presentationFormat";
import type { ReactNode } from "react";
import type { AttendanceMode, CapabilityCode, EvidenceBundle, SelectedMarket, WorkspaceId, WorkspaceNavigationTarget } from "../contracts/v2";

const V2_WORKSPACE_TABS: readonly { readonly id: WorkspaceId; readonly label: string }[] = [
  { id: "markets", label: "Overview" },
  { id: "recruiting", label: "Funnel" },
  { id: "reporters", label: "Reporters" },
  { id: "team", label: "Team" },
  { id: "programs", label: "Programs" },
];

export interface V2GlobalFilters {
  readonly selectedMarket: SelectedMarket;
  readonly capabilityCodes: readonly CapabilityCode[];
  readonly attendanceModes: readonly AttendanceMode[];
}

export interface V2AppShellProps {
  readonly activeWorkspace: WorkspaceId;
  readonly filters: V2GlobalFilters;
  readonly demoDateLabel: string;
  readonly capabilityOptions?: readonly { readonly value: CapabilityCode; readonly label: string }[];
  readonly attendanceOptions?: readonly { readonly value: AttendanceMode; readonly label: string }[];
  readonly actionFeedback?: ReactNode;
  readonly focusCondition?: string;
  readonly selectedEvidence?: EvidenceBundle | null;
  readonly onCloseEvidence?: () => void;
  readonly onOpenEvidenceWork?: (target: WorkspaceNavigationTarget) => void;
  readonly onWorkspaceChange: (workspace: WorkspaceId) => void;
  readonly onFiltersChange: (filters: V2GlobalFilters) => void;
  readonly children: ReactNode;
}

const marketOptions: readonly { readonly value: SelectedMarket; readonly label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "LAX", label: "LAX" },
  { value: "SFO", label: "SFO" },
  { value: "DFW", label: "DFW" },
  { value: "ORD", label: "ORD" },
  { value: "ATL", label: "ATL" },
];

const compactFocus = (value: string) => {
  const match = value.match(/^(.+?) is (under|at|over) SLA at ([\d.]+) days against ([\d.]+) days\./i);
  return match ? `${match[1]} is ${match[2]} SLA at ${Math.round(Number(match[3]))} days.` : value;
};

/** A controlled v2 shell. It deliberately does not own data, filters, or navigation state. */
export function V2AppShell({
  activeWorkspace,
  filters,
  capabilityOptions = [],
  attendanceOptions = [],
  actionFeedback,
  focusCondition,
  selectedEvidence,
  onCloseEvidence,
  onOpenEvidenceWork,
  onWorkspaceChange,
  onFiltersChange,
  children,
}: V2AppShellProps) {
  return (
    <div className="v2-shell">
      <header className="v2-shell__header">
        <div className="v2-shell__title">
          <h1>Provider growth command center</h1>
          <p>Plan court-reporter supply, move candidates toward readiness, and measure growth programs.</p>
        </div>
        <span className="v2-shell__focus">Focus <strong>{compactFocus(focusCondition ?? (filters.selectedMarket === "ALL" ? "All markets" : filters.selectedMarket))}</strong></span>
      </header>
      <div className="v2-shell__navigation">
        <section aria-label="Market" className="v2-market-switcher"><span>Market</span><div>{marketOptions.map((market) => <button aria-pressed={filters.selectedMarket === market.value} className={filters.selectedMarket === market.value ? "is-active" : undefined} key={market.value} onClick={() => onFiltersChange({ ...filters, selectedMarket: market.value })} type="button">{market.label}</button>)}</div><label className="sr-only">Market<select onChange={(event) => onFiltersChange({ ...filters, selectedMarket: event.target.value as SelectedMarket })} value={filters.selectedMarket}>{marketOptions.map((market) => <option key={market.value} value={market.value}>{market.label}</option>)}</select></label></section>
        <nav aria-label="Reporter Growth workspaces" className="v2-shell__tabs">
          {V2_WORKSPACE_TABS.map((tab) => (
            <button
              aria-current={activeWorkspace === tab.id ? "page" : undefined}
              className={activeWorkspace === tab.id ? "is-active" : undefined}
              key={tab.id}
              onClick={() => onWorkspaceChange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <section aria-label="Shared filters" className="v2-filter-bar sr-only">
        {capabilityOptions.length > 0 ? (
          <fieldset>
            <legend>Capabilities</legend>
            {capabilityOptions.map((option) => (
              <label key={option.value}>
                <input
                  checked={filters.capabilityCodes.includes(option.value)}
                  onChange={(event) => onFiltersChange({
                    ...filters,
                    capabilityCodes: event.target.checked
                      ? [...filters.capabilityCodes, option.value]
                      : filters.capabilityCodes.filter((value) => value !== option.value),
                  })}
                  type="checkbox"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        ) : null}
        {attendanceOptions.length > 0 ? (
          <fieldset>
            <legend>Attendance</legend>
            {attendanceOptions.map((option) => (
              <label key={option.value}>
                <input
                  checked={filters.attendanceModes.includes(option.value)}
                  onChange={(event) => onFiltersChange({
                    ...filters,
                    attendanceModes: event.target.checked
                      ? [...filters.attendanceModes, option.value]
                      : filters.attendanceModes.filter((value) => value !== option.value),
                  })}
                  type="checkbox"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        ) : null}
      </section>
      <div className="v2-shell__content">{children}</div>
      {actionFeedback ? <details className="v2-shell__scenario-controls"><summary>Scenario controls</summary><div aria-live="polite">{actionFeedback}</div></details> : null}
      {selectedEvidence && onCloseEvidence && onOpenEvidenceWork ? <Drawer title="Why this?" eyebrow={selectedEvidence.scope.populationDescription} closeLabel="Close evidence" onClose={onCloseEvidence}><p>{selectedEvidence.explanation}</p><p><strong>{selectedEvidence.computation.status === "available" ? `${selectedEvidence.computation.value} ${selectedEvidence.unit}` : selectedEvidence.computation.reason}</strong></p><p className="ip2-scope">{selectedEvidence.reportingWindow ? `Window: ${displayDateRange(selectedEvidence.reportingWindow.startAt, selectedEvidence.reportingWindow.endAt)}` : "Current record scope"} · As of {displayDate(selectedEvidence.asOfAt)}</p><h3>Contributing records</h3><ul>{selectedEvidence.contributingRecords.map((record) => <li key={`${record.kind}-${record.id}`}>{record.label}</li>)}</ul><details><summary>Calculation and limitations</summary><p>{selectedEvidence.metric.id} · {selectedEvidence.metric.version}</p><p>{selectedEvidence.computation.numerator ?? "—"} / {selectedEvidence.computation.denominator ?? "—"} · {selectedEvidence.unknownCount} unknown</p>{selectedEvidence.exclusions.map((item) => <p key={`${item.record.kind}:${item.record.id}`}>{item.reason}</p>)}{selectedEvidence.limitations.map((item) => <p key={item}>{item}</p>)}</details><button className="ui-button ui-button--primary" onClick={() => onOpenEvidenceWork(selectedEvidence.navigationTarget)} type="button">Open the work</button></Drawer> : null}
      <footer className="v2-shell__footer">
        Independent synthetic demo. Fixed dates and simulated events are labeled. No real message is sent and no Steno system is connected.
      </footer>
    </div>
  );
}
