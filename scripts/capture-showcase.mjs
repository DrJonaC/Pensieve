import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { loadBaseMemories } from "../lib/memory-store.ts";

if (!process.env.PLAYWRIGHT_MODULE || process.env.PENSIEVE_PUBLIC_SCREENSHOTS !== "1") {
  throw new Error("Use a fresh isolated server, set PLAYWRIGHT_MODULE and PENSIEVE_PUBLIC_SCREENSHOTS=1.");
}
const base = process.env.PENSIEVE_TEST_URL ?? "http://127.0.0.1:3111";
const response = await fetch(base + "/api/memories");
assert.equal(response.status, 200);
const { records } = await response.json();
const bundled = loadBaseMemories();
assert.equal(records.length, bundled.length, "Public screenshots must contain only bundled sample data");
for (const record of records) {
  const sample = bundled.find(item => item.id === record.id);
  assert.ok(sample && sample.content === record.content && JSON.stringify(sample.keywords) === JSON.stringify(record.keywords), "Refusing to capture a non-sample library");
}
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 1050 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Open Memory Library", exact: true }).waitFor();
  await page.screenshot({ path: "docs/assets/home-overview.png" });
  await page.getByLabel("Interface language").selectOption("zh-CN");
  await page.getByRole("link", { name: "打开记忆管理", exact: true }).waitFor();
  await page.screenshot({ path: "docs/assets/home-overview-zh.png" });
  await page.getByRole("link", { name: "打开记忆管理", exact: true }).click();
  await page.getByRole("heading", { name: "让记忆由你掌握。" }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "networkidle" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log("PASS bilingual showcase, Memory Library entry, mobile layout; captured bundled sample data only");
} finally { await browser.close(); }
