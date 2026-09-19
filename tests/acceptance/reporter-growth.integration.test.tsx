import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/integration/App";
import { REPORTING_TIME_ZONE, type UtcTimestamp, type WorkspaceQueryContext } from "../../src/contracts/v2";
import { DEMO_SNAPSHOT_V2, V2_MAIN_REQUEST_WINDOW } from "../../src/data/v2";
import { prepareMarketsWorkspace } from "../../src/logic/capacity";
import { prepareRecruitingWorkspace } from "../../src/logic/recruiting";

afterEach(cleanup);

async function start() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Provider growth command center" });
  return user;
}

const tab = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}$`) });
const market = (name: string) => within(screen.getByRole("region", { name: "Market" })).getByRole("button", { name: new RegExp(`^${name}$`) });
const baselineContext = <T extends "markets" | "recruiting">(workspace: T): WorkspaceQueryContext<T> => ({
  workspace,
  evaluation: { asOfAt: DEMO_SNAPSHOT_V2.currentAsOfAt, snapshotRevision: DEMO_SNAPSHOT_V2.revision, reportingTimeZone: REPORTING_TIME_ZONE },
  filters: { selectedMarket: "ALL", marketBasis: workspace === "markets" ? "demand-market" : "recruiting-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: workspace === "markets" ? V2_MAIN_REQUEST_WINDOW : { startAt: "2026-01-01T00:00:00Z" as UtcTimestamp, endAt: "2026-02-01T00:00:00Z" as UtcTimestamp, boundary: "[start,end)" } },
});
const dateLabel = (at: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(at));

describe("P4 cross-workspace acceptance", () => {
  it("XR01-XR08/XR31-XR36 keeps the locked shell, concise hierarchy, and source-backed Overview controls", async () => {
    const user = await start();
    expect(market("All")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("navigation", { name: "Reporter Growth workspaces" })).toHaveTextContent("OverviewFunnelReportersTeamPrograms");
    expect(screen.queryByText(/Step \d|What should change on|Looks right|Needs revision|Mission progress/i)).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Reporter Growth workspaces" })).getAllByRole("button")).toHaveLength(5);
    const overview = prepareMarketsWorkspace(DEMO_SNAPSHOT_V2, baselineContext("markets"));
    const { schedule } = overview;
    const metrics = screen.getByRole("region", { name: "Overview metrics" });
    expect(metrics.children).toHaveLength(4);
    for (const [label, value] of [["Requested slots", schedule.coverage.requested], ["Confirmed slots", schedule.coverage.confirmed], ["Unresolved slots", schedule.coverage.unresolved]] as const) {
      const cell = within(metrics).getByText(label, { exact: true }).parentElement!;
      expect(cell.querySelector("strong")).toHaveTextContent(new RegExp(`^${value}$`));
    }
    expect(schedule.coverage.requested).toBe(schedule.coverage.confirmed + schedule.coverage.unresolved);
    expect(within(metrics).getByText(`${schedule.people.confirmed} distinct confirmed people`)).toBeInTheDocument();
    expect(within(metrics).getByText(`${schedule.coverage.possible} possible · ${schedule.coverage.noVerifiedReadyMatch} unverified · ${schedule.coverage.requirementsUnknown} unknown`)).toBeInTheDocument();
    const goalCell = within(metrics).getByText("Newly ready / goal", { exact: true }).parentElement!;
    expect(overview.growthGoal).toBeNull();
    expect(goalCell.querySelector("strong")).toHaveTextContent(/^—$/);
    expect(within(goalCell).getByText("No growth goal saved")).toBeInTheDocument();
    expect(screen.getByText(`${dateLabel(schedule.window!.startAt)} – ${dateLabel(schedule.window!.endAt)} (end exclusive) · One slot per request · As of ${dateLabel(schedule.asOfAt)}. Possible matches are unresolved, not confirmed coverage.`)).toBeInTheDocument();
    const chart = screen.getByRole("group", { name: "Supply and demand. Use left and right arrow keys to inspect observations." });
    const readout = within(chart.closest("figure")!).getByRole("status");
    const assertObservation = (point: NonNullable<typeof overview.supplyDemandSeries>["points"][number]) => {
      expect(readout).toHaveTextContent(`${dateLabel(point.at)} · ${new Date(point.at).toISOString().slice(11, 16)} UTC · ${point.phase === "forecast" ? "Projected" : "Observed"}`);
      expect(within(readout).getByText(`Explicitly available: ${point.availableSupply} people`, { exact: true })).toBeInTheDocument();
      expect(within(readout).getByText(`Scheduled demand: ${point.demand} slots`, { exact: true })).toBeInTheDocument();
      expect(within(readout).getByText(`Positive count gap: ${point.neededSupply} count`, { exact: true })).toBeInTheDocument();
    };
    chart.focus();
    await user.keyboard("{Home}");
    assertObservation(overview.supplyDemandSeries!.points[0]!);
    await user.keyboard("{End}");
    expect(overview.supplyDemandSeries!.points.at(-1)!.phase).toBe("forecast");
    assertObservation(overview.supplyDemandSeries!.points.at(-1)!);
    await user.click(screen.getByRole("button", { name: "Projection on" }));
    expect(screen.getByRole("button", { name: "Projection off" })).toHaveAttribute("aria-pressed", "false");
    chart.focus();
    await user.keyboard("{End}");
    assertObservation(overview.supplyDemandSeries!.points.filter((point) => point.phase === "historical").at(-1)!);
    await user.click(market("LAX"));
    expect(market("LAX")).toHaveAttribute("aria-pressed", "true");
    const marketPanel = screen.getByRole("heading", { name: "Market comparison" }).closest("section")!;
    const marketTable = within(marketPanel).getByRole("table");
    expect(within(marketTable).getAllByRole("row")).toHaveLength(2);
    expect(within(marketTable).getByRole("button", { name: "Los Angeles" })).toBeInTheDocument();
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
    const recruiting = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, baselineContext("recruiting"));
    const chart = screen.getByRole("group", { name: "Applicant wait time. Use left and right arrow keys to inspect observations." });
    chart.focus();
    await user.keyboard("{Home}{ArrowRight}");
    const observation = recruiting.waitTimeTrends.R28.Applicant[1]!;
    const readout = within(chart.closest("figure")!).getByRole("status");
    expect(readout).toHaveTextContent(`${dateLabel(observation.asOfAt)} · ${new Date(observation.asOfAt).toISOString().slice(11, 16)} UTC · Observed`);
    expect(within(readout).getByText(`Mean current wait: ${observation.meanElapsedDays} days`, { exact: true })).toBeInTheDocument();
    const statusFilters = screen.getByLabelText("Filter by status");
    const applicants = recruiting.currentCases.filter((item) => item.funnelStatus === "Applicant");
    const applicantFilter = within(statusFilters).getByRole("button", { name: `Applicant ${applicants.length}` });
    const peoplePanel = screen.getByRole("heading", { name: "People" }).closest("section")!;
    const peopleTable = within(peoplePanel).getByRole("table");
    const displayedPeople = () => within(peopleTable).getAllByRole("button").map((button) => button.textContent);
    expect(displayedPeople()).toEqual(recruiting.currentCases.map((item) => item.reporterName));
    await user.click(applicantFilter);
    expect(applicantFilter).toHaveAttribute("aria-pressed", "true");
    expect(within(statusFilters).getByRole("button", { name: "All statuses" })).toHaveAttribute("aria-pressed", "false");
    expect(displayedPeople()).toEqual(applicants.map((item) => item.reporterName));
    expect(within(peopleTable).getAllByRole("cell", { name: "Applicant" })).toHaveLength(applicants.length);
    expect(within(peoplePanel).getByText(`${applicants.length} records shown`)).toBeInTheDocument();
    await user.click(applicantFilter);
    expect(applicantFilter).toHaveAttribute("aria-pressed", "false");
    expect(within(statusFilters).getByRole("button", { name: "All statuses" })).toHaveAttribute("aria-pressed", "true");
    expect(displayedPeople()).toEqual(recruiting.currentCases.map((item) => item.reporterName));
    expect(within(peoplePanel).getByText(`${recruiting.currentCases.length} records shown`)).toBeInTheDocument();
    const note = screen.getAllByRole("textbox", { name: /Notes for/ })[0]!;
    await user.type(note, "Quality note");
    expect(note).toHaveValue("Quality note");
    await user.click(market("LAX"));
    await user.click(screen.getByRole("button", { name: "Edit SLAs" }));
    const laxContext: WorkspaceQueryContext<"recruiting"> = { ...baselineContext("recruiting"), filters: { ...baselineContext("recruiting").filters, selectedMarket: "LAX", marketIds: ["LAX"] } };
    const laxBefore = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, laxContext);
    const noahBefore = laxBefore.currentCases.find((item) => item.reporterName === "Noah Calder")!;
    const noahRow = within(peopleTable).getByRole("button", { name: "Noah Calder" }).closest("tr")!;
    expect(noahBefore.sla.currentStatus.state).toBe("at");
    expect(within(noahRow).getByText(`${noahBefore.sla.currentStatus.elapsedDays}d · at`, { exact: true })).toBeInTheDocument();
    const onboardingSla = screen.getByRole("spinbutton", { name: "Onboarding SLA in days" });
    expect(onboardingSla).toHaveValue(laxBefore.applicableSla.values.statusDays.Onboarding);
    await user.clear(onboardingSla);
    await user.type(onboardingSla, "90");
    expect(onboardingSla).toHaveValue(90);
    const laxAfter = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, laxContext, { slaInput: { marketOverrides: { LAX: { statusDays: { Onboarding: 90 } } } } });
    const noahAfter = laxAfter.currentCases.find((item) => item.reporterName === "Noah Calder")!;
    expect(noahAfter.sla.currentStatus.state).toBe("under");
    for (const wait of [noahAfter.sla.total, noahAfter.sla.currentStatus]) {
      expect(within(noahRow).getByText(`${wait.elapsedDays}d · ${wait.state}`, { exact: true })).toBeInTheDocument();
    }
    await user.click(market("SFO"));
    const sfo = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, { ...laxContext, filters: { ...laxContext.filters, selectedMarket: "SFO", marketIds: ["SFO"] } });
    expect(onboardingSla).toHaveValue(sfo.applicableSla.values.statusDays.Onboarding);
    await user.click(market("LAX"));
    expect(onboardingSla).toHaveValue(90);
    const attention = screen.getAllByRole("listitem").find((item) => within(item).queryByText("Elena Marlow · LAX", { exact: true }))!;
    const whyThis = within(attention).getByRole("button", { name: "Why this?" });
    await user.click(whyThis);
    const evidence = screen.getByRole("dialog", { name: "Why this?" });
    expect(within(evidence).getByText("Elena Marlow", { exact: true })).toBeInTheDocument();
    expect(within(evidence).getByText("Resolve the missing screening capability evidence: Blocked: p4-capability", { exact: true })).toBeInTheDocument();
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
