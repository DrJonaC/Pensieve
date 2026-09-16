import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

if (!process.env.PLAYWRIGHT_MODULE || process.env.PENSIEVE_UI_TEST_ALLOW_WRITES !== "1") {
  throw new Error("Set PLAYWRIGHT_MODULE and PENSIEVE_UI_TEST_ALLOW_WRITES=1. Use an isolated test library only.");
}
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 1000 }, acceptDownloads: true });
page.setDefaultNavigationTimeout(120000);
page.setDefaultTimeout(60000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const base = process.env.PENSIEVE_TEST_URL ?? "http://127.0.0.1:3111";
const phrase = "Acceptance astronomy memory " + Date.now();
const edited = phrase + " edited";
async function saved() {
  await page.getByRole("status").filter({ hasText: "Saved locally" }).waitFor();
}
async function query(text) {
  const response = await page.request.post(base + "/api/query", { timeout: 120000, data: { query: text, mode: "mock" } });
  assert.equal(response.status(), 200);
  return (await response.json()).activation;
}
try {
  await page.goto(base + "/memories");
  await page.getByRole("button", { name: "Refresh", exact: true }).waitFor();
  await page.getByLabel("Or paste memory notes").fill(phrase + "\n" + phrase);
  await page.getByRole("button", { name: "Preview import" }).click();
  await page.getByText("New: 1 · Duplicates skipped: 1", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await saved();
  console.log("PASS UI import preview, duplicate counting and confirmation");

  await page.reload();
  let card = page.locator("article").filter({ hasText: phrase });
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Memory content", { exact: true }).fill(edited);
  await page.getByLabel("Keywords (comma-separated)").fill("astronomy, acceptance");
  await page.getByRole("button", { name: "Save changes" }).click();
  await saved();
  assert.ok((await query("astronomy")).memories.some(m => m.content === edited));
  console.log("PASS refresh persistence and edited retrieval");

  card = page.locator("article").filter({ hasText: edited });
  await card.getByRole("button", { name: "Hide from retrieval" }).click();
  await saved();
  assert.ok(!(await query("astronomy")).memories.some(m => m.content === edited));
  await card.getByRole("button", { name: "Restore to retrieval" }).click();
  await saved();
  assert.ok((await query("astronomy")).memories.some(m => m.content === edited));
  console.log("PASS hide and restore change actual recall");

  await card.getByLabel("Select for export").check();
  await page.getByLabel("Only selected records").check();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile(await download.path(), "utf8"));
  assert.equal(backup.memories.length, 1);
  assert.equal(backup.memories[0].content, edited);
  await page.getByLabel("Format", { exact: true }).selectOption("json");
  await page.getByLabel("Or paste memory notes").fill(JSON.stringify(backup));
  await page.getByRole("button", { name: "Preview import" }).click();
  await page.getByText("New: 0 · Duplicates skipped: 1", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Confirm import" }).isDisabled(), true);
  console.log("PASS real JSON download, reimport preview and deduplication");

  await page.getByLabel("Or paste memory notes").fill('{"format":"pensieve-memory","version":999}');
  await page.getByRole("button", { name: "Preview import" }).click();
  await page.getByRole("alert").filter({ hasText: "Invalid memory file" }).waitFor();
  assert.ok((await query("astronomy")).memories.some(m => m.content === edited));
  await page.getByLabel("Interface language").selectOption("zh-CN");
  await page.getByRole("heading", { name: "让记忆由你掌握。" }).waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
  await page.reload();
  await page.getByRole("heading", { name: "让记忆由你掌握。" }).waitFor();
  await page.getByLabel("界面语言").selectOption("en");
  console.log("PASS invalid input safety, Chinese guidance and persistent locale");

  await page.getByRole("link", { name: "User View", exact: true }).click();
  await page.locator("article").filter({ hasText: edited }).getByRole("button", { name: "Pin", exact: true }).click();
  await page.locator("article").filter({ hasText: edited }).getByRole("button", { name: "Unpin", exact: true }).waitFor();
  await page.getByRole("link", { name: "Surface Model", exact: true }).click();
  await page.getByRole("heading", { name: "Query-based memory observability" }).waitFor();
  const undoResponse = page.waitForResponse(response => response.url().endsWith("/api/memories") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal((await undoResponse).status(), 200);
  await page.getByRole("button", { name: "Surface Memory", exact: true }).waitFor();
  await page.getByLabel("Query", { exact: true }).fill("astronomy acceptance");
  const queryResponse = page.waitForResponse(response => response.url().endsWith("/api/query"));
  await page.getByRole("button", { name: "Surface Memory", exact: true }).click();
  const result = await (await queryResponse).json();
  assert.ok(result.activation.memories.some(m => m.content === edited && !m.pinned));
  console.log("PASS Surface Model query and persistent cross-route Undo");
  await page.getByRole("link", { name: "Memory Library", exact: true }).click();
  card = page.locator("article").filter({ hasText: edited });
  await card.getByRole("button", { name: "Delete…" }).click();
  await card.getByRole("button", { name: "Confirm delete" }).click();
  await saved();
  assert.ok(!(await query("astronomy")).memories.some(m => m.content === edited));
  console.log("PASS shared routing, deletion confirmation and retrieval removal");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("heading", { name: "Your memories, in your hands." }).waitFor();
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  assert.ok(fits, "Mobile page should not overflow horizontally");
  await page.getByLabel("Interface language").focus();
  await page.keyboard.press("Tab");
  await page.screenshot({ path: ".next/memory-library-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1365, height: 1000 });
  await page.screenshot({ path: ".next/memory-library-desktop.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("PASS mobile layout, keyboard navigation and no browser runtime errors");
} catch (error) {
  await page.screenshot({ path: ".next/memory-library-failure.png", fullPage: true });
  console.error(await page.locator("body").innerText());
  throw error;
} finally { await browser.close(); }
