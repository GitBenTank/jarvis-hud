/**
 * README marketing screenshots (requires `pnpm dev` on :3000).
 *
 * The home page often fits in one viewport; viewport-only captures look
 * identical. We use a top clip for the hero and element screenshots for
 * each panel so images differ.
 *
 * Usage: pnpm dev then: pnpm screenshots:readme
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const marketing = path.join(root, "docs", "marketing");
const base = "http://127.0.0.1:3000";

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
});
await page.emulateMedia({ colorScheme: "dark" });

await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60_000 });
await page.evaluate(() => window.scrollTo(0, 0));

const vp = page.viewportSize();
if (!vp) throw new Error("no viewport");

const opsBox = await page.locator("#operations-row").boundingBox();
if (!opsBox) throw new Error("#operations-row not found");
const heroH = Math.min(
  vp.height,
  Math.max(360, Math.round(opsBox.y - 16))
);
await page.screenshot({
  path: path.join(marketing, "readme-01-mission-boundary.png"),
  clip: { x: 0, y: 0, width: vp.width, height: heroH },
  type: "png",
});
console.log("wrote docs/marketing/readme-01-mission-boundary.png");

await page.locator("#operations-row").screenshot({
  path: path.join(marketing, "readme-02-operations.png"),
  type: "png",
});
console.log("wrote docs/marketing/readme-02-operations.png");

await page.locator("#actions-panel").screenshot({
  path: path.join(marketing, "readme-03-receipts.png"),
  type: "png",
});
console.log("wrote docs/marketing/readme-03-receipts.png");

await page.locator("#trace-timeline").scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.locator("#trace-timeline").screenshot({
  path: path.join(marketing, "readme-04-activity-trace.png"),
  type: "png",
});
console.log("wrote docs/marketing/readme-04-activity-trace.png");

await browser.close();
