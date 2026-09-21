import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { INTERVIEW_V2_STORAGE_KEY, type PersistedDemoSnapshotV2 } from "../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../data/v2";

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
    expect(within(screen.getByRole("region", { name: "Reporter network summary" })).getByText("Needs confirmation").parentElement).toHaveTextContent(/Needs confirmation\d+/);
    expect(marketButton("SFO")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Why this?" }));
    const reporterEvidence = await screen.findByRole("dialog", { name: "Why this?" });
    expect(reporterEvidence).toHaveTextContent("completed work in SFO");
    expect(reporterEvidence).toHaveTextContent(/completed work in the trailing 28 elapsed days/i);
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Team" }));
    expect(await screen.findByRole("main", { name: "Team" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Team metrics" })).getByText("No owner").parentElement).toHaveTextContent("No owner1");

    await user.click(screen.getByRole("button", { name: "Programs" }));
    expect(await screen.findByRole("main", { name: "Programs" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Program metrics" })).getByText("Review now").parentElement).toHaveTextContent("Review now1");

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

    expect(await screen.findByText(/20 mature · 0 observing · 6 \/ 20/)).toBeInTheDocument();
    expect(screen.getByText(/20 mature · 0 observing · 11 \/ 20/)).toBeInTheDocument();

    await user.click(marketButton("LAX"));
    await waitFor(() => {
      expect(screen.getByText(/10 mature · 0 observing · 3 \/ 10/)).toBeInTheDocument();
      expect(screen.getByText(/10 mature · 0 observing · 6 \/ 10/)).toBeInTheDocument();
    });

    await user.click(marketButton("SFO"));
    await waitFor(() => {
      expect(screen.getByText(/10 mature · 0 observing · 3 \/ 10/)).toBeInTheDocument();
      expect(screen.getByText(/10 mature · 0 observing · 5 \/ 10/)).toBeInTheDocument();
    });
  });

  it("persists bounded expansion and explicit linked work without manufacturing operational outcomes", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));
    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Readiness checklist pilot" }));
    await user.click(screen.getByRole("button", { name: "Record decision" }));
    let dialog = screen.getByRole("dialog", { name: "Record program decision" });
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "Decision" }), "expand");
    fireEvent.change(within(dialog).getByLabelText("Next review date"), { target: { value: "2026-03-20" } });
    await user.type(within(dialog).getByLabelText("Decision rationale"), "Review a bounded proposal with the recorded sample limitations.");
    await user.click(within(dialog).getByRole("button", { name: "Save decision" }));
    expect(await within(dialog).findByRole("status")).toHaveTextContent("Decision saved");
    let saved = (JSON.parse(localStorage.getItem(INTERVIEW_V2_STORAGE_KEY)!) as PersistedDemoSnapshotV2).snapshot;
    expect(saved.workItems).toHaveLength(DEMO_SNAPSHOT_V2.workItems.length + 1);
    expect(saved.programDecisions.at(-1)).toMatchObject({ decision: "expand", nextReviewAt: "2026-03-20T17:00:00.000Z" });
    await user.click(within(dialog).getByRole("button", { name: "Back to program" }));
    await user.click(screen.getByRole("button", { name: "Create linked work" }));
    dialog = screen.getByRole("dialog", { name: "Create linked work" });
    await user.type(within(dialog).getByLabelText("Work title"), "Inspect partner handoff evidence");
    await user.click(within(dialog).getByRole("button", { name: "Save linked work" }));
    expect(await within(dialog).findByRole("status")).toHaveTextContent("Linked Team work saved");
    saved = (JSON.parse(localStorage.getItem(INTERVIEW_V2_STORAGE_KEY)!) as PersistedDemoSnapshotV2).snapshot;
    expect(saved.workItems).toHaveLength(DEMO_SNAPSHOT_V2.workItems.length + 2);
    expect(saved.workItems.some((work) => work.title === "Inspect partner handoff evidence" && work.programId === "program-readiness-checklist")).toBe(true);
    expect(saved.programEnrollments).toEqual(DEMO_SNAPSHOT_V2.programEnrollments);
    expect(saved.readinessEvents).toEqual(DEMO_SNAPSHOT_V2.readinessEvents);
    expect(saved.assignmentEvents).toEqual(DEMO_SNAPSHOT_V2.assignmentEvents);
    expect(saved.jobOutcomes).toEqual(DEMO_SNAPSHOT_V2.jobOutcomes);
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(await screen.findByRole("main", { name: "Overview" })).toBeInTheDocument();
    expect(within(metric("Overview metrics", "Confirmed slots")).getByText("6", { exact: true })).toBeInTheDocument();
  }, 15_000);

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
    expect(screen.queryByRole("form", { name: "Add work" })).not.toBeInTheDocument();
    const feedback = await openDemoControls(user);
    expect(feedback).toHaveTextContent("Created canonical Team work: Review partner handoff.");
    expect(feedback).toHaveTextContent("Readiness, acceptance, jobs, and program outcomes did not change.");
  });

  it("persists Programs notes and next steps without changing outcomes", async () => {
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: "Programs" }));
    await screen.findByRole("main", { name: "Programs" });
    await user.click(screen.getAllByRole("button", { name: "Edit notes & next step" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Edit notes and next step" });
    const note = within(dialog).getByRole("textbox", { name: /Notes for/ });
    const nextStep = within(dialog).getByRole("textbox", { name: /Next step for/ });
    await user.clear(note);
    await user.type(note, "Check the synthetic cohort evidence.");
    await user.clear(nextStep);
    await user.type(nextStep, "Review again next week.");
    await user.click(within(dialog).getByRole("button", { name: "Save notes and next step" }));
    expect(await within(dialog).findByRole("status")).toHaveTextContent("Notes and next step saved");
    await user.keyboard("{Escape}");
    const feedback = await openDemoControls(user);
    expect(feedback).toHaveTextContent("Saved the program next step.");
    expect(feedback).toHaveTextContent("Program results, stage, enrollment, rollout, readiness, acceptance, and jobs did not change.");
  });
});
