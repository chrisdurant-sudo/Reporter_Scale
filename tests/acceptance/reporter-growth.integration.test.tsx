import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/integration/App";

afterEach(cleanup);

async function start() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Provider growth command center" });
  return user;
}

const tab = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}$`) });
const market = (name: string) => within(screen.getByRole("region", { name: "Market" })).getByRole("button", { name: new RegExp(`^${name}$`) });

describe("P4 cross-workspace acceptance", () => {
  it("XR01-XR08/XR31-XR36 keeps the locked shell, concise hierarchy, and source-backed Overview controls", async () => {
    const user = await start();
    expect(market("All")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("navigation", { name: "Reporter Growth workspaces" })).toHaveTextContent("OverviewFunnelReportersTeamPrograms");
    expect(screen.queryByText(/Step \d|What should change on|Looks right|Needs revision|Mission progress/i)).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Reporter Growth workspaces" })).getAllByRole("button")).toHaveLength(5);
    expect(within(screen.getByRole("region", { name: "Overview metrics" })).getAllByText(/Markets|Available reporters|Open jobs|More needed/)).toHaveLength(4);
    expect(screen.getByRole("img", { name: /Supply, demand and needed supply; scale zero to/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Projection on" }));
    expect(screen.getByRole("button", { name: "Projection off" })).toHaveAttribute("aria-pressed", "false");
    await user.click(market("LAX"));
    expect(market("LAX")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Market comparison" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "View Funnel" }));
    expect(tab("Funnel")).toHaveAttribute("aria-current", "page");
  });

  it("XR09-XR10/XR15-XR18/XR37 exercises Funnel controls, notes, SLA isolation, evidence, and focus return", async () => {
    const user = await start();
    await user.click(tab("Funnel"));
    expect(screen.getByRole("main", { name: "Funnel" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "R28" }));
    await user.click(screen.getByRole("button", { name: /^Applicant$/ }));
    expect(screen.getByRole("button", { name: "R28" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: /R28 wait time for Applicant/i })).toBeInTheDocument();
    const statusFilters = screen.getByLabelText("Filter by status");
    const applicantFilter = within(statusFilters).getByRole("button", { name: /Applicant \d+/ });
    await user.click(applicantFilter);
    expect(applicantFilter).toHaveAttribute("aria-pressed", "false");
    await user.click(applicantFilter);
    const note = screen.getAllByRole("textbox", { name: /Notes for/ })[0]!;
    await user.type(note, "Quality note");
    expect(note).toHaveValue("Quality note");
    await user.click(market("LAX"));
    await user.click(screen.getByRole("button", { name: "Edit SLAs" }));
    const onboardingSla = screen.getByRole("spinbutton", { name: "Onboarding SLA in days" });
    await user.clear(onboardingSla);
    await user.type(onboardingSla, "90");
    expect(onboardingSla).toHaveValue(90);
    expect(screen.getAllByText(/Under|At|Over/).length).toBeGreaterThan(3);
    const whyThis = screen.getByRole("button", { name: "Why this?" });
    await user.click(whyThis);
    expect(screen.getByRole("dialog", { name: "Why this?" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Why this?" })).not.toBeInTheDocument();
    expect(whyThis).toHaveFocus();
  });

  it("XR11/XR15/XR17/XR38 preserves market scope and exposes reporter readiness, compliance, and bounded follow-up", async () => {
    const user = await start();
    await user.click(market("SFO"));
    await user.click(tab("Reporters"));
    expect(market("SFO")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("main", { name: "Reporters" })).toHaveTextContent(/Ready|Active in 28 days|Inactive 28\+ days|Licenses to check/);
    expect(screen.getByRole("columnheader", { name: "Certifications" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Compliance" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(screen.getByRole("button", { name: "Activity" })).toHaveAttribute("aria-pressed", "true");
    const search = screen.getByRole("searchbox", { name: "Search reporters" });
    await user.type(search, "zzzz");
    expect(screen.getByText("No reporters match these filters.")).toBeInTheDocument();
    await user.clear(search);
    const available = screen.getByRole("combobox", { name: "Availability" });
    await user.selectOptions(available, "unknown");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Confirm availability" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Create re-engagement task" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Inspect checklist" }).length).toBeGreaterThan(0);
  });

  it("XR12/XR17/XR39 creates Team work through the real form and retains the required board semantics", async () => {
    const user = await start();
    await user.click(tab("Team"));
    const team = screen.getByRole("main", { name: "Team" });
    expect(team).toHaveTextContent(/Open tasks|No owner|Programs owned|Coaching due/);
    expect(screen.queryByText(/^Late$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "What needs attention" })).not.toBeInTheDocument();
    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add work" }));
    const form = screen.getByRole("form", { name: "Add work" });
    await user.type(within(form).getByRole("textbox", { name: "Work title" }), "Quality-owned program follow-up");
    await user.selectOptions(within(form).getByRole("combobox", { name: "Status" }), "in-progress");
    await user.selectOptions(within(form).getByRole("combobox", { name: "Domain" }), "program");
    await user.click(within(form).getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Work added.")).toBeInTheDocument();
    expect(team).toHaveTextContent("Quality-owned program follow-up");
  });

  it("XR13/XR15-XR18/XR40 keeps Programs results, filters, target-met evidence, and text persistence source-safe", async () => {
    const user = await start();
    await user.click(tab("Programs"));
    expect(screen.getByRole("main", { name: "Programs" })).toHaveTextContent(/Running|Review now|Expanding|Stopped/);
    expect(screen.getByText("Target met")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Results" }));
    expect(screen.getByRole("button", { name: "Results" })).toHaveAttribute("aria-pressed", "true");
    await user.selectOptions(screen.getByRole("combobox", { name: "Type" }), "Campaign");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "Stopped");
    expect(screen.getByRole("table")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Type" }), "All");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "All");
    const notes = screen.getAllByRole("textbox", { name: /Notes for/ });
    await user.clear(notes[0]!);
    await user.type(notes[0]!, "Quality persistence note");
    await user.tab();
    expect(await screen.findByText(/saved.*note|note.*saved/i)).toBeInTheDocument();
    await user.click(tab("Overview"));
    await user.click(tab("Programs"));
    expect(screen.getByDisplayValue("Quality persistence note")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Source" })).toBeInTheDocument();
  });
});
