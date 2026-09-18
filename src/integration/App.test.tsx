import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

afterEach(cleanup);

async function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Provider growth command center" });
  await screen.findByRole("main", { name: "Overview" });
  return user;
}

function marketButton(name: "All" | "LAX" | "SFO" | "DFW" | "ORD" | "ATL") {
  return screen.getByRole("button", { name });
}

function metric(regionName: "Overview metrics" | "Funnel metrics", label: string) {
  const region = screen.getByRole("region", { name: regionName });
  return within(region).getByText(label).parentElement;
}

async function openDemoControls(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText(/^Demo controls ·/));
  return screen.getByRole("region", { name: "Scenario and action result" });
}

describe("P4 integrated V2 experience", () => {
  it("renders all five workspaces, keeps the market across navigation, and retains the synthetic disclosure", async () => {
    const user = await renderApp();

    expect(marketButton("All")).toHaveAttribute("aria-pressed", "true");
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");
    expect(metric("Overview metrics", "Open jobs")).toHaveTextContent("11");
    expect(screen.getByText(/Independent synthetic demo.*No real message is sent and no Steno system is connected/i)).toBeInTheDocument();

    await user.click(marketButton("SFO"));
    expect(marketButton("SFO")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Funnel" }));
    expect(await screen.findByRole("main", { name: "Funnel" })).toBeInTheDocument();
    expect(marketButton("SFO")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Reporters" }));
    expect(await screen.findByRole("heading", { name: "What can our network support?" })).toBeInTheDocument();
    expect(marketButton("SFO")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Team" }));
    expect(await screen.findByRole("heading", { name: "What is holding up the team's work?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Programs" }));
    expect(await screen.findByRole("heading", { name: "Which growth efforts should we keep?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(await screen.findByRole("main", { name: "Overview" })).toBeInTheDocument();
  });

  it("saves the goal without manufacturing readiness, coverage, acceptance, or first-job outcomes", async () => {
    const user = await renderApp();
    await user.click(marketButton("LAX"));
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");
    expect(metric("Overview metrics", "Open jobs")).toHaveTextContent("10");

    await user.click(screen.getByRole("button", { name: "Save goal revision" }));

    expect(await screen.findByText(/Saved the dated two-addition LAX readiness goal/i)).toBeInTheDocument();
    expect(screen.getByText(/Coverage remains 6 confirmed, 2 possible, and 2 without a verified ready match/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 2 first-time readiness additions/i)).toBeInTheDocument();
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");
    expect(metric("Overview metrics", "Open jobs")).toHaveTextContent("10");
  });

  it("keeps planning, readiness, acceptance, and delivery as separate replayable checkpoints", async () => {
    const user = await renderApp();
    await user.click(marketButton("LAX"));
    const feedback = await openDemoControls(user);

    await user.click(within(feedback).getByRole("button", { name: "Advance to Plan saved" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: Plan saved"));
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");

    await user.click(within(feedback).getByRole("button", { name: "Advance to Existing candidates accepted" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: Existing candidates accepted"));
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");

    await user.click(within(feedback).getByRole("button", { name: "Advance to Two new reporters ready" }));
    expect(await screen.findByText(/2 of 2 first-time readiness additions/i)).toBeInTheDocument();
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");

    await user.click(within(feedback).getByRole("button", { name: "Advance to New reporters accepted" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: New reporters accepted"));
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");
    expect(screen.getByText(/0 completed requests · 0 first jobs/i)).toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "Advance to Original plan delivered" }));
    await waitFor(() => expect(metric("Overview metrics", "Open jobs")).toHaveTextContent("0"));
    expect(screen.getByText(/10 completed requests · 2 first jobs/i)).toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "Advance to Pair onboarding cohort mature" }));
    await user.click(screen.getByRole("button", { name: "Funnel" }));
    expect(await screen.findByRole("main", { name: "Funnel" })).toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "Reset demo" }));
    expect(await screen.findByRole("main", { name: "Overview" })).toBeInTheDocument();
    expect(feedback).toHaveTextContent("Baseline");
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");
    expect(metric("Overview metrics", "Open jobs")).toHaveTextContent("11");
    expect(marketButton("All")).toHaveAttribute("aria-pressed", "true");
  });

  it("opens contextual evidence, closes on Escape with focus return, and carries exact context into work", async () => {
    const user = await renderApp();
    await user.click(marketButton("LAX"));
    const trigger = screen.getByRole("button", { name: "Why this?" });

    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Why this?" });
    expect(dialog).toHaveTextContent(/distinct non-canceled request slots/i);
    expect(dialog).toHaveTextContent(/Window:/i);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Why this?" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    await user.click(within(await screen.findByRole("dialog", { name: "Why this?" })).getByRole("button", { name: "Open the work" }));
    const context = await screen.findByRole("region", { name: "Preserved evidence context" });
    expect(context).toHaveTextContent("M01 v2-frozen-1");
    expect(context).toHaveTextContent("revision 0");
    expect(context).toHaveTextContent("10 request");
  });

  it("reconciles program membership for LAX, All, and SFO without averaging percentages", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));

    expect(await screen.findByText(/6 of 20 within the identical declared horizon/i)).toBeInTheDocument();
    expect(screen.getByText(/11 of 20 within the identical declared horizon/i)).toBeInTheDocument();

    await user.click(marketButton("LAX"));
    await waitFor(() => {
      expect(screen.getByText(/3 of 10 within the identical declared horizon/i)).toBeInTheDocument();
      expect(screen.getByText(/6 of 10 within the identical declared horizon/i)).toBeInTheDocument();
    });

    await user.click(marketButton("SFO"));
    await waitFor(() => {
      expect(screen.getByText(/3 of 10 within the identical declared horizon/i)).toBeInTheDocument();
      expect(screen.getByText(/5 of 10 within the identical declared horizon/i)).toBeInTheDocument();
    });
  });

  it("persists program commands without manufacturing operational outcomes", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));
    const feedback = await openDemoControls(user);

    await user.click(screen.getByRole("button", { name: "Expand" }));
    await waitFor(() => expect(feedback).toHaveTextContent(/Saved the expand decision with its current evidence/i));
    expect(feedback).toHaveTextContent(/No participant, readiness, acceptance, job outcome, frozen cohort, or other market changed/i);

    await user.click(screen.getByRole("button", { name: "Save as process draft" }));
    await waitFor(() => expect(feedback).toHaveTextContent(/Saved a new versioned process draft/i));
    expect(feedback).toHaveTextContent(/No rollout, enrollment, readiness, acceptance, outcome, or other market changed/i);

    await user.click(screen.getByRole("button", { name: "Create Team partner task" }));
    await waitFor(() => expect(feedback).toHaveTextContent(/Created one canonical Team partner task/i));
    expect(feedback).toHaveTextContent(/No program result, rollout, readiness, acceptance, or job outcome changed/i);

    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(await screen.findByRole("main", { name: "Overview" })).toBeInTheDocument();
    expect(metric("Overview metrics", "Available reporters")).toHaveTextContent("0");
  });
});
