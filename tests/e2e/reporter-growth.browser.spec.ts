import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const distDirectory = path.resolve("dist");
const contentTypes: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

test.beforeEach(async ({ page }) => {
  await page.route("http://reporter-growth.test/**", async (route) => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(distDirectory, relativePath);
    if (!filePath.startsWith(`${distDirectory}${path.sep}`)) {
      await route.fulfill({ status: 404, body: "Not found" });
      return;
    }
    try {
      const body = await readFile(filePath);
      await route.fulfill({
        status: 200,
        body,
        contentType: contentTypes[path.extname(filePath)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "Not found" });
    }
  });
});

test.describe("Reporter Growth browser acceptance", () => {
  test("global market filter persists between tabs and the LAX flow exposes stable anchors", async ({ page }) => {
    await page.goto("/");
    const laxButton = page.getByRole("button", { name: "LAX", exact: true });
    await expect(laxButton).toHaveAttribute("aria-pressed", "false");
    await laxButton.click();
    await expect(laxButton).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Reporters" }).click();
    await expect(laxButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("reporters-screen")).toBeVisible();
    await page.getByRole("button", { name: "Improvements" }).click();
    await expect(laxButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("improvements-screen")).toBeVisible();
  });

  test("has no whole-page horizontal overflow at required widths", async ({ page }) => {
    for (const width of [390, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });

  test("detail panel closes with Escape and returns focus to its opener", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reporters" }).click();
    const opener = page.getByTestId("reporter-row-reporter-lax-004");
    await opener.click();
    const panel = page.getByTestId("reporter-detail");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("simulation and reset controls are keyboard reachable and permanently disclose synthetic scope", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("demo-disclosure")).toHaveText(
      "Independent application concept. Synthetic data. Not connected to Steno systems.",
    );
    await expect(page.getByRole("button", { name: /Run late first-job simulation/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: /Reset demo/i })).toBeEnabled();
  });
});
