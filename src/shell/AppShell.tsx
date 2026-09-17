import type { AppShellProps, AppTab, SelectedMarket } from "../contracts";
import { TEST_ANCHORS } from "../contracts";

const tabs: { id: AppTab; label: string }[] = [
  { id: "markets", label: "Markets" },
  { id: "reporters", label: "Reporters" },
  { id: "improvements", label: "Improvements" },
];

export function AppShell({
  activeTab,
  selectedMarket,
  marketOptions,
  demoDateLabel,
  onTabChange,
  onMarketChange,
  onReset,
  onRunSimulation,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell" data-testid={TEST_ANCHORS.app}>
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Provider operations concept</p>
          <h1>Reporter Growth</h1>
        </div>
        <p>Demo date: {demoDateLabel}</p>
      </header>
      <nav aria-label="Primary">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <label>
        Market
        <select
          data-testid={TEST_ANCHORS.marketSelector}
          value={selectedMarket}
          onChange={(event) => onMarketChange(event.target.value as SelectedMarket)}
        >
          {marketOptions.map((market) => (
            <option key={market.value} value={market.value}>
              {market.fullLabel}
            </option>
          ))}
        </select>
      </label>
      <main>{children}</main>
      <footer>
        <p data-testid={TEST_ANCHORS.demoDisclosure}>
          Independent application concept. Synthetic data. Not connected to Steno systems.
        </p>
        <button type="button" onClick={() => void onRunSimulation()}>
          Run late first-job simulation
        </button>
        <button type="button" onClick={() => void onReset()}>
          Reset demo
        </button>
      </footer>
    </div>
  );
}
