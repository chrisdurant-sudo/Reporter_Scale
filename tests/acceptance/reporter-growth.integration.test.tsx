import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/integration/App";

afterEach(cleanup);
async function start() { const user = userEvent.setup(); render(<App />); await screen.findByRole("heading", { name: "Where do we need more capacity?" }); return user; }
const market = () => screen.getByRole("combobox", { name: "Market" });
const feedback = () => screen.getByRole("region", { name: "Scenario and action result" });

describe("V2 cross-workspace acceptance", () => {
  it("S01/M01/M02 shows an independently reconciled 6+2+2 partition and shared evidence navigation", async () => {
    const user = await start();
    const demand = screen.getByRole("region", { name: "Upcoming request coverage" });
    const text = demand.textContent ?? "";
    expect((text.match(/Confirmed/g) ?? []).length).toBe(6);
    const requests = within(demand).getAllByRole("listitem");
    expect(requests.filter((item) => item.textContent?.includes("Possible match")).length).toBe(2);
    expect(requests.filter((item) => item.textContent?.includes("No verified ready match")).length).toBe(2);
    expect(screen.getByText(/Possible matches are candidate options, not guaranteed/i)).toBeInTheDocument();
    const evidence = screen.getByRole("region", { name: "Shared evidence panel" });
    await user.click(within(evidence).getByRole("button", { name: "Why this? M02" }));
    await user.click(within(evidence).getByRole("button", { name: "Why this?", expanded: false }));
    expect(within(evidence).getByRole("table", { name: "Contributing source records" })).toBeInTheDocument();
    expect(evidence).toHaveTextContent(/Definition: M02 \(v2-frozen-1\)/);
    await user.click(within(evidence).getByRole("button", { name: "Open the work" }));
    expect(screen.getByRole("region", { name: "Preserved evidence context" })).toHaveTextContent(/10 request/);
  });

  it("S02-S06 keeps planning, readiness, acceptance, and delivery as separate checkpoints", async () => {
    const user = await start();
    const baseline = screen.getByText(/10 requested slots · 6 confirmed · 2 possible options · 2 with no verified ready match/i).textContent;
    await user.click(screen.getByRole("button", { name: "Save goal revision" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/Saved the dated two-addition/);
    expect(screen.getByText(baseline!)).toBeInTheDocument();
    const checkpoints = [["Advance to Existing candidates accepted", /10 requested slots · 8 confirmed · 0 possible options · 2 with no verified ready match/], ["Advance to Two new reporters ready", /10 requested slots · 8 confirmed · 2 possible options · 0 with no verified ready match/], ["Advance to New reporters accepted", /10 requested slots · 10 confirmed · 0 possible options · 0 with no verified ready match/]] as const;
    for (const [button, result] of checkpoints) { await user.click(screen.getByRole("button", { name: button })); expect(await screen.findByText(result)).toBeInTheDocument(); }
    expect(screen.getByText(/0 completed requests and 0 first jobs/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Advance to Original plan delivered" }));
    expect(await screen.findByText(/10 completed requests and 2 first jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/No real message is sent and no Steno system is connected/i)).toBeInTheDocument();
  });

  it("S07/M05 distinguishes timely first jobs from late jobs after the pair cohort matures", async () => {
    const user = await start();
    for (const name of ["Advance to Plan saved", "Advance to Existing candidates accepted", "Advance to Two new reporters ready", "Advance to New reporters accepted", "Advance to Original plan delivered", "Advance to Pair onboarding cohort mature"]) await user.click(screen.getByRole("button", { name }));
    await user.click(screen.getByRole("button", { name: "Recruiting" }));
    expect(await screen.findByText("1/2 within 14 days.")).toBeInTheDocument();
    expect(screen.getByText(/1 finalized 30-day cohort members; 3 still being observed/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Markets" }));
    expect(screen.getByText(/10 completed requests and 2 first jobs from the frozen request set/)).toBeInTheDocument();
  });

  it("U01/U05/W06-W08 preserves filters and keeps actions descriptive without rollout or external writes", async () => {
    const user = await start();
    await user.selectOptions(market(), "SFO");
    await user.click(screen.getByRole("button", { name: "Programs" }));
    expect(market()).toHaveValue("SFO");
    expect(await screen.findByRole("heading", { name: "Which growth efforts should we keep?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/Saved the expand decision/);
    expect(feedback()).toHaveTextContent(/No participant, readiness, acceptance, job outcome.*other market changed/i);
    await user.click(screen.getByRole("button", { name: "Save as process draft" }));
    expect(feedback()).toHaveTextContent(/Saved a new versioned process draft/);
    expect(feedback()).toHaveTextContent(/No rollout, enrollment, readiness, acceptance, outcome, or other market changed/);
    await user.click(screen.getByRole("button", { name: "Create Team partner task" }));
    expect(feedback()).toHaveTextContent(/canonical Team partner task/);
    expect(feedback()).toHaveTextContent(/No program result, rollout, readiness, acceptance, or job outcome changed/);
    await user.click(screen.getByRole("button", { name: "Markets" }));
    expect(market()).toHaveValue("SFO");
  });

  it("D06/U04 resets after all scenario steps, supports replay protection, and returns to the baseline", async () => {
    const user = await start();
    for (const name of ["Advance to Plan saved", "Advance to Existing candidates accepted", "Advance to Two new reporters ready", "Advance to New reporters accepted", "Advance to Original plan delivered", "Advance to Pair onboarding cohort mature"]) await user.click(screen.getByRole("button", { name }));
    expect(feedback()).toHaveTextContent(/Pair onboarding cohort mature/);
    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(await screen.findByRole("heading", { name: "Where do we need more capacity?" })).toBeInTheDocument();
    expect(feedback()).toHaveTextContent("Baseline");
    expect(market()).toHaveValue("LAX");
    expect(screen.getByText(/10 requested slots · 6 confirmed · 2 possible options · 2 with no verified ready match/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(feedback()).toHaveTextContent(/No external data or system was touched/);
  });
});
