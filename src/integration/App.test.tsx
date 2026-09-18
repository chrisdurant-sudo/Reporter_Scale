import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

afterEach(cleanup);

async function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Where do we need more capacity?" });
  return user;
}

function marketSelect() {
  return screen.getByRole("combobox", { name: "Market" });
}

describe("P3 live V2 vertical", () => {
  it("renders all five workspaces, keeps the market selector across navigation, and retains the synthetic disclosure", async () => {
    const user = await renderApp();

    expect(screen.getByText(/10 requested slots · 6 confirmed · 2 possible options · 2 with no verified ready match/i)).toBeInTheDocument();
    expect(screen.getByText(/Independent synthetic demo.*No real message is sent and no Steno system is connected/i)).toBeInTheDocument();

    await user.selectOptions(marketSelect(), "SFO");
    await user.click(screen.getByRole("button", { name: "Recruiting" }));
    expect(await screen.findByRole("heading", { name: "Where are new reporters getting stuck?" })).toBeInTheDocument();
    expect(marketSelect()).toHaveValue("SFO");

    await user.click(screen.getByRole("button", { name: "Reporters" }));
    expect(await screen.findByRole("heading", { name: "What can our network support?" })).toBeInTheDocument();
    expect(marketSelect()).toHaveValue("SFO");

    await user.click(screen.getByRole("button", { name: "Team" }));
    expect(await screen.findByRole("heading", { name: "What is holding up the team's work?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Programs" }));
    expect(await screen.findByRole("heading", { name: "Which growth efforts should we keep?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Markets" }));
    expect(await screen.findByRole("heading", { name: "Where do we need more capacity?" })).toBeInTheDocument();
  });

  it("saves the plan without manufacturing readiness, acceptance, coverage, or first-job outcomes", async () => {
    const user = await renderApp();
    const baseline = /10 requested slots · 6 confirmed · 2 possible options · 2 with no verified ready match/i;
    expect(screen.getByText(baseline)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save goal revision" }));
    expect(await screen.findByText(/Saved the dated two-addition LAX readiness goal/i)).toBeInTheDocument();
    expect(screen.getByText(/Coverage remains 6 confirmed, 2 possible, and 2 without a verified ready match/i)).toBeInTheDocument();
    expect(screen.getByText(baseline)).toBeInTheDocument();
    expect(screen.getByText(/0 of 2 first-time readiness additions/i)).toBeInTheDocument();
  });

  it("walks the dated LAX checkpoints, separates readiness from acceptance and delivery, then resets deterministically", async () => {
    const user = await renderApp();

    await user.click(screen.getByRole("button", { name: "Advance to Plan saved" }));
    expect(await screen.findByRole("button", { name: "Advance to Existing candidates accepted" })).toBeInTheDocument();
    expect(screen.getByText(/10 requested slots · 6 confirmed · 2 possible options · 2 with no verified ready match/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Advance to Existing candidates accepted" }));
    expect(await screen.findByText(/10 requested slots · 8 confirmed · 0 possible options · 2 with no verified ready match/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Advance to Two new reporters ready" }));
    expect(await screen.findByText(/10 requested slots · 8 confirmed · 2 possible options · 0 with no verified ready match/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 2 first-time readiness additions/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Advance to New reporters accepted" }));
    expect(await screen.findByText(/10 requested slots · 10 confirmed · 0 possible options · 0 with no verified ready match/i)).toBeInTheDocument();
    expect(screen.getByText(/0 completed requests and 0 first jobs from the frozen request set/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Advance to Original plan delivered" }));
    expect(await screen.findByText(/0 requested slots · 0 confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/10 completed requests and 2 first jobs from the frozen request set/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Advance to Pair onboarding cohort mature" }));
    await user.click(screen.getByRole("button", { name: "Recruiting" }));
    expect(await screen.findByText("1/3 within 14 days.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(await screen.findByRole("heading", { name: "Where do we need more capacity?" })).toBeInTheDocument();
    expect(screen.getByText(/Checkpoint:/).parentElement).toHaveTextContent("Baseline");
    expect(screen.getByText(/10 requested slots · 6 confirmed · 2 possible options · 2 with no verified ready match/i)).toBeInTheDocument();
    expect(marketSelect()).toHaveValue("LAX");
  });

  it("opens the exact shared EvidenceBundle and carries its as-of, revision, metric version, and record filters into work", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Why this? M02" }));

    const panel = screen.getByRole("region", { name: "Shared evidence panel" });
    await user.click(within(panel).getByRole("button", { name: "Why this?" }));
    expect(within(panel).getByText(/M02 \(v2-frozen-1\)/)).toBeInTheDocument();
    expect(within(panel).getByRole("table", { name: "Contributing source records" })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Open the work" }));
    const context = await screen.findByRole("region", { name: "Preserved evidence context" });
    expect(context).toHaveTextContent("M02 v2-frozen-1");
    expect(context).toHaveTextContent("revision 0");
    expect(context).toHaveTextContent("10 request");
  });

  it("reconciles checklist membership overall and for LAX/SFO without averaging percentages", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));

    expect(await screen.findByText(/3 of 10 within the identical declared horizon/i)).toBeInTheDocument();
    expect(screen.getByText(/6 of 10 within the identical declared horizon/i)).toBeInTheDocument();

    await user.selectOptions(marketSelect(), "ALL");
    await waitFor(() => {
      expect(screen.getByText(/6 of 20 within the identical declared horizon/i)).toBeInTheDocument();
      expect(screen.getByText(/11 of 20 within the identical declared horizon/i)).toBeInTheDocument();
    });

    await user.selectOptions(marketSelect(), "SFO");
    await waitFor(() => {
      expect(screen.getByText(/3 of 10 within the identical declared horizon/i)).toBeInTheDocument();
      expect(screen.getByText(/5 of 10 within the identical declared horizon/i)).toBeInTheDocument();
    });
  });

  it("persists a program decision, process draft, and partner task without manufacturing operational outcomes", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));
    expect(await screen.findByText(/3 of 10 within the identical declared horizon/i)).toBeInTheDocument();
    expect(screen.getByText(/6 of 10 within the identical declared horizon/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(await screen.findByText(/Saved the expand decision with its current evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/No participant, readiness, acceptance, job outcome, frozen cohort, or other market changed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save as process draft" }));
    expect(await screen.findByText(/Saved a new versioned process draft/i)).toBeInTheDocument();
    expect(screen.getByText(/No rollout, enrollment, readiness, acceptance, outcome, or other market changed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Team partner task" }));
    expect(await screen.findByText(/Created one canonical Team partner task/i)).toBeInTheDocument();
    expect(screen.getByText(/No program result, rollout, readiness, acceptance, or job outcome changed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Markets" }));
    expect(await screen.findByText(/10 requested slots · 6 confirmed · 2 possible options · 2 with no verified ready match/i)).toBeInTheDocument();
  });
});
