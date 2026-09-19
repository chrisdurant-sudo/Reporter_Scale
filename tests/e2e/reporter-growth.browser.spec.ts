import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { REPORTING_TIME_ZONE, type UtcTimestamp, type WorkspaceQueryContext } from "../../src/contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../../src/data/v2";
import { prepareRecruitingWorkspace } from "../../src/logic/recruiting";

const distDirectory = path.resolve("dist");
const configuredExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({ launchOptions: configuredExecutable ? { executablePath: configuredExecutable } : {} });
const recruitingContext: WorkspaceQueryContext<"recruiting"> = {
  workspace: "recruiting",
  evaluation: { asOfAt: DEMO_SNAPSHOT_V2.currentAsOfAt, snapshotRevision: DEMO_SNAPSHOT_V2.revision, reportingTimeZone: REPORTING_TIME_ZONE },
  filters: { selectedMarket: "ALL", marketBasis: "recruiting-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: { startAt: "2026-01-01T00:00:00Z" as UtcTimestamp, endAt: "2026-02-01T00:00:00Z" as UtcTimestamp, boundary: "[start,end)" } },
};
const recruiting = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, recruitingContext);

test.beforeEach(async ({ page }) => {
  await page.route("http://reporter-growth.test/**", async (route) => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(distDirectory, relativePath);
    if (!filePath.startsWith(`${distDirectory}${path.sep}`)) return route.fulfill({ status: 404, body: "Not found" });
    const extension = path.extname(filePath);
    const contentType = extension === ".html" ? "text/html" : extension === ".css" ? "text/css" : extension === ".js" ? "text/javascript" : "application/octet-stream";
    try { await route.fulfill({ status: 200, body: await readFile(filePath), contentType }); }
    catch { await route.fulfill({ status: 404, body: "Not found" }); }
  });
});

async function assertNoPageOverflow(page: import("@playwright/test").Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}

test.describe("P4 browser acceptance", () => {
  test("XR01-XR08/XR22 keeps every workspace reachable without page overflow at the active viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Provider growth command center" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
    for (const workspace of ["Overview", "Funnel", "Reporters", "Team", "Programs"] as const) {
      await page.getByRole("navigation", { name: "Reporter Growth workspaces" }).getByRole("button", { name: workspace, exact: true }).click();
      await expect(page.getByRole("navigation", { name: "Reporter Growth workspaces" }).getByRole("button", { name: workspace, exact: true })).toHaveAttribute("aria-current", "page");
      await assertNoPageOverflow(page);
    }
    await expect(page.getByText(/Independent synthetic demo.*No real message is sent/i)).toBeVisible();
  });

  test("XR09-XR10/XR15/XR37 changes Funnel range, status, filters, and a market-specific SLA without lifecycle leakage", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Funnel", exact: true }).click();
    await page.getByRole("button", { name: "R28" }).click();
    await page.getByRole("button", { name: "Applicant", exact: true }).click();
    await expect(page.getByRole("button", { name: "R28" })).toHaveAttribute("aria-pressed", "true");
    const chart = page.getByRole("group", { name: "Applicant wait time. Use left and right arrow keys to inspect observations." });
    await expect(chart).toBeVisible();
    await chart.focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    const observation = recruiting.waitTimeTrends.R28.Applicant[1]!;
    const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(observation.asOfAt));
    const readout = page.getByRole("figure").filter({ has: chart }).getByRole("status");
    await expect(readout).toContainText(`${date} · ${new Date(observation.asOfAt).toISOString().slice(11, 16)} UTC · Observed`);
    await expect(readout.getByText(`Mean current wait: ${observation.meanElapsedDays} days`, { exact: true })).toBeVisible();
    const applicants = recruiting.currentCases.filter((item) => item.funnelStatus === "Applicant");
    const statusFilters = page.getByLabel("Filter by status");
    const applicantFilter = statusFilters.getByRole("button", { name: `Applicant ${applicants.length}`, exact: true });
    const peopleTable = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Candidate", exact: true }) });
    await expect(peopleTable.getByRole("button")).toHaveText(recruiting.currentCases.map((item) => item.reporterName));
    await applicantFilter.click();
    await expect(applicantFilter).toHaveAttribute("aria-pressed", "true");
    await expect(statusFilters.getByRole("button", { name: "All statuses" })).toHaveAttribute("aria-pressed", "false");
    await expect(peopleTable.getByRole("button")).toHaveText(applicants.map((item) => item.reporterName));
    await expect(peopleTable.getByRole("cell", { name: "Applicant", exact: true })).toHaveCount(applicants.length);
    await expect(page.getByText(`${applicants.length} records shown`, { exact: true })).toBeVisible();
    await applicantFilter.click();
    await expect(applicantFilter).toHaveAttribute("aria-pressed", "false");
    await expect(statusFilters.getByRole("button", { name: "All statuses" })).toHaveAttribute("aria-pressed", "true");
    await expect(peopleTable.getByRole("button")).toHaveText(recruiting.currentCases.map((item) => item.reporterName));
    await expect(page.getByText(`${recruiting.currentCases.length} records shown`, { exact: true })).toBeVisible();
    const note = page.getByRole("textbox", { name: /Notes for/ }).first();
    await note.pressSequentially("Browser quality note");
    await expect(note).toHaveValue("Browser quality note");
    await page.getByRole("button", { name: "LAX", exact: true }).click();
    await page.getByRole("button", { name: "Edit SLAs" }).click();
    const laxContext: WorkspaceQueryContext<"recruiting"> = { ...recruitingContext, filters: { ...recruitingContext.filters, selectedMarket: "LAX", marketIds: ["LAX"] } };
    const laxBefore = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, laxContext);
    const noahBefore = laxBefore.currentCases.find((item) => item.reporterName === "Noah Calder")!;
    const noahRow = peopleTable.getByRole("row").filter({ has: page.getByRole("button", { name: "Noah Calder", exact: true }) });
    expect(noahBefore.sla.currentStatus.state).toBe("at");
    await expect(noahRow.getByText(`${noahBefore.sla.currentStatus.elapsedDays}d · at`, { exact: true })).toBeVisible();
    const sla = page.getByRole("spinbutton", { name: "Onboarding SLA in days" });
    await expect(sla).toHaveValue(String(laxBefore.applicableSla.values.statusDays.Onboarding));
    await sla.fill("90");
    await expect(sla).toHaveValue("90");
    const laxAfter = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, laxContext, { slaInput: { marketOverrides: { LAX: { statusDays: { Onboarding: 90 } } } } });
    const noahAfter = laxAfter.currentCases.find((item) => item.reporterName === "Noah Calder")!;
    expect(noahAfter.sla.currentStatus.state).toBe("under");
    for (const wait of [noahAfter.sla.total, noahAfter.sla.currentStatus]) {
      await expect(noahRow.getByText(`${wait.elapsedDays}d · ${wait.state}`, { exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "SFO", exact: true }).click();
    const sfo = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, { ...laxContext, filters: { ...laxContext.filters, selectedMarket: "SFO", marketIds: ["SFO"] } });
    await expect(sla).toHaveValue(String(sfo.applicableSla.values.statusDays.Onboarding));
    await page.getByRole("button", { name: "LAX", exact: true }).click();
    await expect(sla).toHaveValue("90");
    await page.getByText("Scenario controls", { exact: true }).click();
    await expect(page.getByText(/Lifecycle, readiness, acceptance, and completed-work facts did not change/i)).toBeVisible();
    await assertNoPageOverflow(page);
  });

  test("XR16/XR19-XR25 keeps the evidence drawer keyboard-operable and full-screen at 390px", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Funnel", exact: true }).click();
    const attention = page.getByRole("listitem").filter({ has: page.getByText("Tobin Shaw · ORD", { exact: true }) });
    const trigger = attention.getByRole("button", { name: "Why this?", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog", { name: "Why this?" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Tobin Shaw", { exact: true })).toBeVisible();
    await expect(drawer.getByText("Complete sample-required-evidence: Blocked: same-required-step-missing", { exact: true })).toBeVisible();
    if (testInfo.project.name === "mobile") {
      const box = await drawer.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(389);
      expect(box?.height).toBeGreaterThanOrEqual(843);
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    await assertNoPageOverflow(page);
  });

  test("XR11-XR13/XR17/XR38-XR40 performs reporter, Team, and Programs working actions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reporters", exact: true }).click();
    await page.getByRole("button", { name: "Activity" }).click();
    const reporterSearch = page.getByRole("searchbox", { name: "Search reporters" });
    await reporterSearch.fill("zzzz");
    await expect(page.getByText("No reporters match these filters.")).toBeVisible();
    await reporterSearch.fill("");
    await page.getByRole("button", { name: "Team", exact: true }).click();
    await page.getByRole("button", { name: "Add work" }).click();
    const form = page.getByRole("form", { name: "Add work" });
    await form.getByRole("textbox", { name: "Work title" }).fill("Browser quality work");
    await form.getByRole("combobox", { name: "Status" }).selectOption("in-progress");
    await form.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Work added.")).toBeVisible();
    await expect(page.getByRole("main", { name: "Team" })).toContainText("Browser quality work");
    await page.getByRole("navigation", { name: "Reporter Growth workspaces" }).getByRole("button", { name: "Programs", exact: true }).click();
    await expect(page.getByText("Target met")).toBeVisible();
    const notes = page.getByRole("textbox", { name: /Notes for/ }).first();
    await notes.fill("Browser persistence note");
    await notes.blur();
    await page.getByText("Scenario controls", { exact: true }).click();
    await expect(page.getByText(/saved.*note|note.*saved/i)).toBeVisible();
    await page.getByRole("navigation", { name: "Reporter Growth workspaces" }).getByRole("button", { name: "Overview", exact: true }).click();
    await page.getByRole("navigation", { name: "Reporter Growth workspaces" }).getByRole("button", { name: "Programs", exact: true }).click();
    const savedNotes = page.getByRole("textbox", { name: /Notes for/ }).first();
    await expect(savedNotes).toBeVisible();
    await expect(savedNotes).toHaveValue("Browser persistence note");
    await assertNoPageOverflow(page);
  });
});
