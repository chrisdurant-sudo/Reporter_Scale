import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const distDirectory = path.resolve("dist");
const configuredExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({ launchOptions: configuredExecutable ? { executablePath: configuredExecutable } : {} });
test.beforeEach(async ({ page }) => {
  await page.route("http://reporter-growth.test/**", async (route) => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(distDirectory, relativePath);
    if (!filePath.startsWith(`${distDirectory}${path.sep}`)) return route.fulfill({ status: 404, body: "Not found" });
    const extension = path.extname(filePath);
    const contentType = extension === ".html" ? "text/html" : extension === ".css" ? "text/css" : extension === ".js" ? "text/javascript" : extension === ".json" ? "application/json" : "application/octet-stream";
    try { await route.fulfill({ status: 200, body: await readFile(filePath), contentType }); }
    catch { await route.fulfill({ status: 404, body: "Not found" }); }
  });
});

test.describe("V2 browser acceptance", () => {
  test("U01/U05 keeps the market and synthetic disclosure across all five workspaces", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Where do we need more capacity?" })).toBeVisible();
    const market = page.getByRole("combobox", { name: "Market" });
    await market.selectOption("SFO");
    for (const [tab, heading] of [["Recruiting", "Where are new reporters getting stuck?"], ["Reporters", "What can our network support?"], ["Team", "What is holding up the team's work?"], ["Programs", "Which growth efforts should we keep?"]]) {
      await page.getByRole("button", { name: tab }).click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(market).toHaveValue("SFO");
    }
    await expect(page.getByText(/No real message is sent and no Steno system is connected/i)).toBeVisible();
  });

  test("U02/U04 opens evidence, carries exact context, and supports keyboard navigation", async ({ page }) => {
    await page.goto("/");
    const evidence = page.getByRole("region", { name: "Shared evidence panel" });
    await evidence.getByRole("button", { name: "Why this? M02" }).click();
    await evidence.getByRole("button", { name: "Why this?", exact: true, expanded: false }).click();
    await expect(evidence.getByRole("table", { name: "Contributing source records" })).toBeVisible();
    await evidence.getByRole("button", { name: "Open the work" }).click();
    await expect(page.getByRole("region", { name: "Preserved evidence context" })).toContainText("M02 v2-frozen-1");
    await page.getByRole("button", { name: "Clear drill-down" }).click();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("D06 advances and resets deterministically without replaying the final checkpoint", async ({ page }) => {
    await page.goto("/");
    for (const name of ["Advance to Plan saved", "Advance to Existing candidates accepted", "Advance to Two new reporters ready", "Advance to New reporters accepted", "Advance to Original plan delivered", "Advance to Pair onboarding cohort mature"]) await page.getByRole("button", { name }).click();
    await expect(page.getByRole("button", { name: "Final checkpoint reached" })).toBeDisabled();
    await page.getByRole("button", { name: "Reset demo" }).click();
    await expect(page.getByText("Checkpoint: Baseline")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Market" })).toHaveValue("LAX");
  });

  test("U04 desktop interview demo has no page-level horizontal overflow at 1280px and 1440px (390px waived)", async ({ page }) => {
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
});
