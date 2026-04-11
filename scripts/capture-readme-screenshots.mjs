/**
 * One-off: capture README marketing screenshots (requires `pnpm dev` on :3000).
 * Usage: pnpm dev (port 3000) then: node scripts/capture-readme-screenshots.mjs
 * Requires: devDependency playwright-core; Chrome/Edge for channel launch.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const marketing = path.join(root, "docs", "marketing");

const base = "http://127.0.0.1:3000";
const out = [
  ["readme-01-mission-boundary.png", async (page) => {
    await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60_000 });
  }],
  ["readme-02-operations.png", async (page) => {
    await page.locator("#operations-row").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  }],
  ["readme-03-receipts.png", async (page) => {
    await page.locator("#actions-panel").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  }],
  ["readme-04-activity-trace.png", async (page) => {
    await page.getByRole("heading", { name: "Activity Timeline" }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
  }],
];

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
});
await page.emulateMedia({ colorScheme: "dark" });

for (const [name, fn] of out) {
  await fn(page);
  await page.screenshot({
    path: path.join(marketing, name),
    type: "png",
  });
  console.log("wrote", path.join("docs/marketing", name));
}

await browser.close();
