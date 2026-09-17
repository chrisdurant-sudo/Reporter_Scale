import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/integration/App";

describe("Reporter Growth cross-feature acceptance", () => {
  afterEach(() => cleanup());

  it("INT-01 completes the LAX plan, reporter follow-up, improvement decision, and process draft flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    const marketSelector = screen.getByTestId("market-selector");
    await user.selectOptions(marketSelector, "LAX");
    expect(marketSelector).toHaveValue("LAX");
    expect(screen.getByRole("heading", { name: "Los Angeles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where we need more reporters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Preview.*plan/i }));
    expect(screen.getByText("Hypothetical plan preview")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Save.*plan/i }));
    expect(await screen.findByText("Plan saved. Actual completed jobs were not changed.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reporters" }));
    expect(marketSelector).toHaveValue("LAX");
    expect(screen.getByTestId("reporters-screen")).toBeInTheDocument();
    await user.click(await screen.findByTestId("reporter-row-reporter-lax-004"));
    const reporterPanel = screen.getByTestId("reporter-detail");
    expect(within(reporterPanel).getByRole("heading", { name: "Taylor Davis" })).toBeInTheDocument();
    await user.clear(within(reporterPanel).getByLabelText("Next step"));
    await user.type(within(reporterPanel).getByLabelText("Next step"), "Confirm the next onboarding session.");
    await user.clear(within(reporterPanel).getByLabelText("Due"));
    await user.type(within(reporterPanel).getByLabelText("Due"), "2026-02-20");
    await user.type(within(reporterPanel).getByLabelText("Update note"), "Confirmed a concrete owner and due date.");
    await user.click(within(reporterPanel).getByRole("button", { name: "Save follow-up" }));
    expect(await within(reporterPanel).findByText("Follow-up saved. No message or completed job was created.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Improvements" }));
    expect(marketSelector).toHaveValue("LAX");
    expect(screen.getByTestId("improvements-screen")).toBeInTheDocument();
    expect(screen.getByText("Not enough results yet")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Continue" }));
    await user.type(screen.getByLabelText(/rationale/i), "Keep the clearer screening brief under observation.");
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    expect(await screen.findByText(/Current record: Continue/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save as process" }));
    expect(await screen.findByRole("heading", { name: "Editable process draft" })).toBeInTheDocument();
  });

  it("INT-02 keeps the mature historical cohort fixed, makes one late completion, and reset is idempotent", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Reporters" }));
    const historicalOutcome = await screen.findByText(/Historical 14-day outcome:/i);
    const baselineRate = historicalOutcome.textContent;
    const reporterCountBefore = screen.queryAllByTestId(/^reporter-row-/).length;

    await user.click(screen.getByRole("button", { name: /Run late first-job simulation/i }));
    expect(await screen.findByText(/^Simulation advanced the demo and completed one late first job/i)).toBeInTheDocument();
    expect(screen.getByText(/Historical 14-day outcome:/i).textContent).toBe(baselineRate);
    expect(screen.queryAllByTestId(/^reporter-row-/)).toHaveLength(reporterCountBefore);

    await user.click(screen.getByRole("button", { name: "Markets" }));
    await user.click(screen.getByRole("button", { name: /Run late first-job simulation/i }));
    expect(screen.getByText(/already replayed|no duplicate|one time|idempotent/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reset demo/i }));
    expect(await screen.findByText(/^Demo reset to the baseline/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Reset demo/i }));
    expect(await screen.findByText(/^Demo reset to the baseline/i)).toBeInTheDocument();
  });

  it("SAFE-01 keeps the independent synthetic disclosure and does not expose real connection or send actions", () => {
    render(<App />);

    expect(screen.getByTestId("demo-disclosure")).toHaveTextContent(
      "Independent application concept. Synthetic data. Not connected to Steno systems.",
    );
    expect(screen.queryByRole("button", { name: /connect to steno|connect live|send message|reject candidate/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/api key|secret|production backend|real reporter/i)).not.toBeInTheDocument();
  });
});
