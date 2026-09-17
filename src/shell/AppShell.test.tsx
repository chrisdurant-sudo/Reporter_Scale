import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MarketOption, SelectedMarket } from "../contracts";
import { AppShell } from "./AppShell";

const options: MarketOption[] = [
  { value: "ALL", shortLabel: "All markets", fullLabel: "All markets" },
  { value: "LAX", shortLabel: "LAX", fullLabel: "LAX — Los Angeles" },
];

describe("AppShell", () => {
  it("offers exactly the three main tabs and reports market changes through its controlled callback", async () => {
    const user = userEvent.setup();
    const onMarketChange = vi.fn<(market: SelectedMarket) => void>();
    const onTabChange = vi.fn();
    render(
      <AppShell
        activeTab="markets"
        demoDateLabel="Feb 16, 2026"
        marketOptions={options}
        mutationMessage=""
        mutationStatus="idle"
        onMarketChange={onMarketChange}
        onReset={async () => ({ ok: true, value: undefined, message: "Reset" })}
        onRunSimulation={async () => ({ ok: true, value: undefined, message: "Simulated" })}
        onTabChange={onTabChange}
        selectedMarket="ALL"
      >
        <section>Screen content</section>
      </AppShell>,
    );

    expect(screen.getAllByRole("navigation")[0]).toHaveTextContent("MarketsReportersImprovements");
    expect(screen.getAllByRole("button", { name: /Markets|Reporters|Improvements/ })).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "LAX" }));
    expect(onMarketChange).toHaveBeenCalledWith("LAX");
    expect(screen.getByTestId("demo-disclosure")).toHaveTextContent("Synthetic data");
  });
});
