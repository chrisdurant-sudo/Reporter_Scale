import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { INTERVIEW_V2_STORAGE_KEY } from "../contracts/v2";

afterEach(() => { cleanup(); localStorage.removeItem(INTERVIEW_V2_STORAGE_KEY); });

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
  return within(region).getByText(label).parentElement!;
}

async function openDemoControls(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("Scenario controls"));
  return screen.getByRole("region", { name: "Scenario and action result" });
}

describe("P4 integrated V2 experience", () => {
  it("renders all five workspaces, keeps the market across navigation, and retains the synthetic disclosure", async () => {
    const user = await renderApp();

    expect(marketButton("All")).toHaveAttribute("aria-pressed", "true");
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("6", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Requested slots")).getByText("11", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Unresolved slots")).getByText("5", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Independent synthetic demo.*No real message is sent and no Steno system is connected/i)).toBeInTheDocument();

    await user.click(marketButton("SFO"));
    expect(marketButton("SFO")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "View Funnel" }));
    expect(await screen.findByRole("main", { name: "Funnel" })).toBeInTheDocument();
    expect(marketButton("SFO")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Reporters" }));
    expect(await screen.findByRole("main", { name: "Reporters" })).toBeInTheDocument();
    expect(screen.getByText(/\d+ need availability confirmation/)).toBeInTheDocument();
    expect(marketButton("SFO")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Why this?" }));
    const reporterEvidence = await screen.findByRole("dialog", { name: "Why this?" });
    expect(reporterEvidence).toHaveTextContent("completed work in SFO");
    expect(reporterEvidence).toHaveTextContent(/completed work in the trailing 28 elapsed days/i);
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Team" }));
    expect(await screen.findByRole("main", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByText("1 task needs an owner")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Programs" }));
    expect(await screen.findByRole("main", { name: "Programs" })).toBeInTheDocument();
    expect(screen.getByText("1 review is due")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(await screen.findByRole("main", { name: "Overview" })).toBeInTheDocument();
  });

  it("uses the locked Overview composition without restoring the superseded growth-goal panel", async () => {
    const user = await renderApp();
    await user.click(marketButton("LAX"));
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("6", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Requested slots")).getByText("10", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Unresolved slots")).getByText("4", { exact: true })).toBeInTheDocument();
    expect(metric("Overview metrics", "Newly ready / goal")).toHaveTextContent("No growth goal saved");
    expect(screen.queryByText("Growth goal")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save goal revision" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cross-workspace overview" })).toBeInTheDocument();
  });

  it("keeps planning, readiness, acceptance, and delivery as separate replayable checkpoints", async () => {
    const user = await renderApp();
    await user.click(marketButton("LAX"));
    const feedback = await openDemoControls(user);

    await user.click(within(feedback).getByRole("button", { name: "Advance to Plan saved" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: Plan saved"));
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("6", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Unresolved slots")).getByText("4", { exact: true })).toBeInTheDocument();
    expect(metric("Overview metrics", "Newly ready / goal")).toHaveTextContent(/0\s*\/\s*2/);

    await user.click(within(feedback).getByRole("button", { name: "Advance to Existing candidates accepted" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: Existing candidates accepted"));
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("8", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Unresolved slots")).getByText("2", { exact: true })).toBeInTheDocument();
    expect(metric("Overview metrics", "Newly ready / goal")).toHaveTextContent(/0\s*\/\s*2/);

    await user.click(within(feedback).getByRole("button", { name: "Advance to Two new reporters ready" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: Two new reporters ready"));
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("8", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Unresolved slots")).getByText("2", { exact: true })).toBeInTheDocument();
    expect(metric("Overview metrics", "Newly ready / goal")).toHaveTextContent(/2\s*\/\s*2/);

    await user.click(within(feedback).getByRole("button", { name: "Advance to New reporters accepted" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: New reporters accepted"));
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("10", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Unresolved slots")).getByText("0", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Requested slots")).getByText("10", { exact: true })).toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "Advance to Original plan delivered" }));
    await waitFor(() => expect(within(metric("Overview metrics", "Requested slots")).getByText("0", { exact: true })).toBeInTheDocument());
    expect(feedback).toHaveTextContent("Checkpoint: Original plan delivered");

    await user.click(within(feedback).getByRole("button", { name: "Advance to Pair onboarding cohort mature" }));
    await user.click(screen.getByRole("button", { name: "Funnel" }));
    expect(await screen.findByRole("main", { name: "Funnel" })).toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "Reset demo" }));
    expect(await screen.findByRole("main", { name: "Overview" })).toBeInTheDocument();
    expect(feedback).toHaveTextContent("Baseline");
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("6", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Requested slots")).getByText("11", { exact: true })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Unresolved slots")).getByText("5", { exact: true })).toBeInTheDocument();
    expect(marketButton("All")).toHaveAttribute("aria-pressed", "true");
  }, 15_000); // Multiple persisted checkpoints and reset must finish before the next DOM test.

  it("opens contextual evidence, closes on Escape with focus return, and carries exact context into work", async () => {
    const user = await renderApp();
    await user.click(marketButton("LAX"));
    const attentionRow = screen.getByText("2 request slots: no verified ready match.").closest("li")!;
    const trigger = within(attentionRow).getByRole("button", { name: "Why this?" });

    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Why this?" });
    expect(dialog).toHaveTextContent(/2 request slots: no verified ready match/i);
    expect(dialog).toHaveTextContent("Feb 23, 2026 – Mar 2, 2026 (end exclusive)");
    expect(dialog).toHaveTextContent("As of Feb 16, 2026");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Why this?" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    await user.click(within(await screen.findByRole("dialog", { name: "Why this?" })).getByRole("button", { name: "Open the work" }));
    const context = await screen.findByRole("region", { name: "Preserved evidence context" });
    expect(context).toHaveTextContent("2 linked requests");
    expect(context).toHaveTextContent("LAX");
    expect(context).toHaveTextContent("evidence as of");
    expect(context).not.toHaveTextContent("M01 v2-frozen-1");
    await user.click(screen.getByRole("button", { name: "Team" }));
    expect(screen.queryByRole("region", { name: "Preserved evidence context" })).not.toBeInTheDocument();
  });

  it("reconciles program membership for LAX, All, and SFO without averaging percentages", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));

    expect(await screen.findByRole("img", { name: /6 of 20 timely first jobs.*11 of 20 timely first jobs/i })).toBeInTheDocument();

    await user.click(marketButton("LAX"));
    await waitFor(() => {
      expect(screen.getByRole("img", { name: /3 of 10 timely first jobs.*6 of 10 timely first jobs/i })).toBeInTheDocument();
    });

    await user.click(marketButton("SFO"));
    await waitFor(() => {
      expect(screen.getByRole("img", { name: /3 of 10 timely first jobs.*5 of 10 timely first jobs/i })).toBeInTheDocument();
    });
  });

  it("persists program commands without manufacturing operational outcomes", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));
    const feedback = await openDemoControls(user);
    await user.click(screen.getByRole("button", { name: "Results" }));

    await user.click(screen.getByRole("button", { name: "Expand" }));
    await waitFor(() => expect(feedback).toHaveTextContent(/Saved the expand decision with its current evidence/i));
    expect(feedback).toHaveTextContent(/No participant, readiness, acceptance, job outcome, frozen cohort, or other market changed/i);

    await user.click(screen.getByRole("button", { name: "Save process draft" }));
    await waitFor(() => expect(feedback).toHaveTextContent(/Saved a new versioned process draft/i));
    expect(feedback).toHaveTextContent(/No rollout, enrollment, readiness, acceptance, outcome, or other market changed/i);

    await user.click(screen.getByRole("button", { name: "Create partner task" }));
    await waitFor(() => expect(feedback).toHaveTextContent(/Created one canonical Team partner task/i));
    expect(feedback).toHaveTextContent(/No program result, rollout, readiness, acceptance, or job outcome changed/i);

    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(await screen.findByRole("main", { name: "Overview" })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("6", { exact: true })).toBeInTheDocument();
  });

  it("creates canonical Team work from the locked Add work form", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Team" }));
    await screen.findByRole("main", { name: "Team" });

    await user.click(screen.getByRole("button", { name: "Add work" }));
    const form = screen.getByRole("form", { name: "Add work" });
    await user.type(within(form).getByRole("textbox", { name: "Work title" }), "Review partner handoff");
    await user.selectOptions(within(form).getByRole("combobox", { name: "Status" }), "in-progress");
    await user.selectOptions(within(form).getByRole("combobox", { name: "Domain" }), "program");
    await user.click(within(form).getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Review partner handoff")).toBeInTheDocument();
    expect(screen.getByText("Work added.")).toBeInTheDocument();
    const feedback = await openDemoControls(user);
    expect(feedback).toHaveTextContent("Created canonical Team work: Review partner handoff.");
    expect(feedback).toHaveTextContent("Readiness, acceptance, jobs, and program outcomes did not change.");
  });

  it("persists Programs notes and next steps without changing outcomes", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));
    await screen.findByRole("main", { name: "Programs" });
    const notes = screen.getAllByRole("textbox", { name: /Notes for/ });
    const nextSteps = screen.getAllByRole("textbox", { name: /Next step for/ });

    await user.clear(notes[0]!);
    await user.type(notes[0]!, "Check the synthetic cohort evidence.");
    await user.tab();
    const feedback = await openDemoControls(user);
    await waitFor(() => expect(feedback).toHaveTextContent("Saved the program note."));
    expect(feedback).toHaveTextContent("Program results, stage, enrollment, rollout, readiness, acceptance, and jobs did not change.");

    await user.clear(nextSteps[0]!);
    await user.type(nextSteps[0]!, "Review again next week.");
    await user.tab();
    await waitFor(() => expect(feedback).toHaveTextContent("Saved the program next step."));
  });
});
