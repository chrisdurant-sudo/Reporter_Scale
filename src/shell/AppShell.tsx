import type { AppShellProps, AppTab, SelectedMarket } from "../contracts";
import { TEST_ANCHORS } from "../contracts";
import { Button, Notice } from "../ui";

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
  mutationStatus,
  mutationMessage,
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
        <p className="app-date">Demo date: {demoDateLabel}</p>
      </header>
      <nav aria-label="Primary" className="app-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={activeTab === tab.id ? "is-active" : undefined}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <section aria-label="Market selection" className="market-selector">
        <span className="market-selector__label">Market</span>
        <div className="market-selector__desktop" role="group" aria-label="Market">
          {marketOptions.map((market) => (
            <button
              aria-pressed={selectedMarket === market.value}
              className={selectedMarket === market.value ? "is-selected" : undefined}
              key={market.value}
              onClick={() => onMarketChange(market.value)}
              type="button"
            >
              {market.shortLabel}
            </button>
          ))}
        </div>
        <label className="market-selector__mobile">
          <span className="sr-only">Market</span>
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
      </section>
      {mutationStatus !== "idle" && mutationMessage ? (
        <Notice tone={mutationStatus === "error" ? "danger" : mutationStatus === "saved" ? "success" : "info"}>
          {mutationMessage}
        </Notice>
      ) : null}
      <main className="app-content">{children}</main>
      <footer className="app-footer">
        <p data-testid={TEST_ANCHORS.demoDisclosure}>
          Independent application concept. Synthetic data. Not connected to Steno systems.
        </p>
        <Button type="button" variant="secondary" busy={mutationStatus === "saving"} onClick={() => void onRunSimulation()}>
          Run late first-job simulation
        </Button>
        <Button type="button" variant="quiet" busy={mutationStatus === "saving"} onClick={() => void onReset()}>
          Reset demo
        </Button>
      </footer>
    </div>
  );
}
