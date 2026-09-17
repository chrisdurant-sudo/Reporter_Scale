import type { ReactNode } from "react";
import type { AttendanceMode, CapabilityCode, SelectedMarket, WorkspaceId } from "../contracts/v2";

const V2_WORKSPACE_TABS: readonly { readonly id: WorkspaceId; readonly label: string }[] = [
  { id: "markets", label: "Markets" },
  { id: "recruiting", label: "Recruiting" },
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
  readonly onWorkspaceChange: (workspace: WorkspaceId) => void;
  readonly onFiltersChange: (filters: V2GlobalFilters) => void;
  readonly children: ReactNode;
}

const marketOptions: readonly { readonly value: SelectedMarket; readonly label: string }[] = [
  { value: "ALL", label: "All markets" },
  { value: "LAX", label: "LAX" },
  { value: "SFO", label: "SFO" },
  { value: "DFW", label: "DFW" },
  { value: "ORD", label: "ORD" },
  { value: "ATL", label: "ATL" },
];

/** A controlled v2 shell. It deliberately does not own data, filters, or navigation state. */
export function V2AppShell({
  activeWorkspace,
  filters,
  demoDateLabel,
  capabilityOptions = [],
  attendanceOptions = [],
  actionFeedback,
  onWorkspaceChange,
  onFiltersChange,
  children,
}: V2AppShellProps) {
  return (
    <div className="v2-shell">
      <header className="v2-shell__header">
        <div>
          <p className="v2-shell__eyebrow">Reporter Growth</p>
          <h1>Supply growth, with the evidence visible</h1>
        </div>
        <p className="v2-shell__date">Fixed demo date: {demoDateLabel}</p>
      </header>
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
      <section aria-label="Shared filters" className="v2-filter-bar">
        <label>
          <span>Market</span>
          <select
            onChange={(event) => onFiltersChange({ ...filters, selectedMarket: event.target.value as SelectedMarket })}
            value={filters.selectedMarket}
          >
            {marketOptions.map((market) => <option key={market.value} value={market.value}>{market.label}</option>)}
          </select>
        </label>
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
      {actionFeedback ? <div aria-live="polite" className="v2-shell__feedback">{actionFeedback}</div> : null}
      <main className="v2-shell__content">{children}</main>
      <footer className="v2-shell__footer">
        Independent synthetic demo. Fixed dates and simulated events are labeled. No real message is sent and no Steno system is connected.
      </footer>
    </div>
  );
}
