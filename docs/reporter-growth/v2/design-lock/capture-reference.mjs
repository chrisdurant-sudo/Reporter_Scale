import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const referenceUrl = pathToFileURL(path.join(here, "reporter-growth-reference.html")).href;
const screenshotDir = path.join(here, "screenshots");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await mkdir(screenshotDir, { recursive: true });

const tabs = ["markets", "recruiting", "reporters", "team", "programs"];
const labels = {
  markets: "overview",
  recruiting: "funnel",
  reporters: "reporters",
  team: "team",
  programs: "programs",
};

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

async function openReference(viewport, tab) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(referenceUrl, { waitUntil: "load" });
  const frame = page.frameLocator("#codex-visualization");
  await frame.locator("#reporter-growth-tab-canvas").waitFor();
  await frame.locator(`[data-tab="${tab}"]`).click();
  await page.waitForTimeout(250);
  return { context, page, frame };
}

async function captureViewport(tab, viewport, suffix, setup) {
  const { context, page, frame } = await openReference(viewport, tab);
  if (setup) {
    await setup(frame);
    await page.waitForTimeout(200);
  }
  await page.screenshot({
    path: path.join(screenshotDir, `${labels[tab]}-${suffix}.png`),
    fullPage: false,
  });
  await context.close();
}

async function captureFullPage(tab) {
  const { context, page, frame } = await openReference({ width: 1440, height: 900 }, tab);
  const contentHeight = await frame.locator("body").evaluate((body) => body.scrollHeight);
  await page.locator("#codex-visualization").evaluate((iframe, height) => {
    iframe.style.height = `${height}px`;
  }, contentHeight);
  await page.waitForTimeout(100);
  await page.screenshot({
    path: path.join(screenshotDir, `${labels[tab]}-full-1440.png`),
    fullPage: true,
  });
  await context.close();
}

for (const tab of tabs) {
  await captureViewport(tab, { width: 1440, height: 900 }, "desktop-1440x900");
  await captureViewport(tab, { width: 390, height: 844 }, "mobile-390x844");
  await captureFullPage(tab);
}

await captureViewport(
  "recruiting",
  { width: 1440, height: 900 },
  "sla-editor-desktop-1440x900",
  async (frame) => frame.locator("[data-edit-sla]").click(),
);

await captureViewport(
  "team",
  { width: 1440, height: 900 },
  "add-work-desktop-1440x900",
  async (frame) => frame.locator("[data-toggle-add-work]").click(),
);

await browser.close();
