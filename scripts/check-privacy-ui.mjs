import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { parseMemoryImport, exportMemoryJson } from "../lib/memory-transfer.ts";

if (!process.env.PLAYWRIGHT_MODULE || process.env.PENSIEVE_UI_TEST_ALLOW_WRITES !== "1") {
  throw new Error("Set PLAYWRIGHT_MODULE and PENSIEVE_UI_TEST_ALLOW_WRITES=1; use an isolated library only.");
}
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(30000);
const base = process.env.PENSIEVE_TEST_URL ?? "http://127.0.0.1:3111";
const fakeKey = "sk-proj-" + "privacy-acceptance-not-real-123456789";
const record = parseMemoryImport(`privacycanary ${fakeKey}`, "text")[0];
const read = async () => (await page.request.get(base + "/api/memories")).json();
const post = async data => {
  const response = await page.request.post(base + "/api/memories", { data });
  assert.equal(response.status(), 200);
  return response.json();
};
const initial = await read();
await post({ operation: "import", revision: initial.revision, ...JSON.parse(exportMemoryJson([record])) });
try {
  assert.equal((await page.request.get(base + "/cdv-test")).status(), 404);
  await page.goto(base + "/surface-model");
  await page.getByRole("button", { name: "Surface Memory", exact: true }).waitFor();
  await page.getByLabel("Query", { exact: true }).fill("privacycanary");
  const responsePromise = page.waitForResponse(response => response.url().endsWith("/api/query"));
  await page.getByRole("button", { name: "Surface Memory", exact: true }).click();
  const response = await responsePromise;
  assert.equal(response.status(), 200);
  const payload = await response.json();
  assert.ok(!JSON.stringify(payload.data).includes(fakeKey));
  assert.match(JSON.stringify(payload.data), /\[REDACTED:/);
  assert.ok(!payload.activation.response.includes(fakeKey));
  assert.ok(!JSON.stringify(payload.activation.reasons).includes(fakeKey));
  const panel = page.getByRole("heading", { name: "Answer and memory summary" }).locator("..");
  await panel.getByText("[REDACTED:API_KEY]", { exact: false }).first().waitFor();
  assert.ok(!(await panel.innerText()).includes(fakeKey));
  assert.equal((await read()).records.find(item => item.id === record.id).content, record.content);
  console.log("PASS production diagnostic 404, mock API/UI redaction and unchanged raw library");

  await page.route("**/api/query", route => route.fulfill({ status: 500, contentType: "application/json",
    body: JSON.stringify({ error: `External service says: password=synthetic-private-password; key ${fakeKey}` }) }));
  await page.getByLabel("Query", { exact: true }).fill("error-check");
  await page.getByRole("button", { name: "Surface Memory", exact: true }).click();
  await page.getByText("External service says:", { exact: false }).waitFor();
  const errorText = await page.getByText("External service says:", { exact: false }).innerText();
  assert.ok(!errorText.includes(fakeKey) && !errorText.includes("synthetic-private-password"));
  assert.match(errorText, /\[REDACTED:/);
  await page.getByLabel("Interface language").selectOption("zh-CN");
  await page.getByText("错误: External service says:", { exact: false }).waitFor();
  console.log("PASS external error credentials hidden while original language remains unchanged");
} finally {
  const current = await read();
  if (current.records.some(item => item.id === record.id)) await post({ operation: "delete", revision: current.revision, id: record.id });
  await browser.close();
}
