import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { parseMemoryImport, exportMemoryJson } from "../lib/memory-transfer.ts";

if (!process.env.PLAYWRIGHT_MODULE || process.env.PENSIEVE_UI_TEST_ALLOW_WRITES !== "1") {
  throw new Error("Set PLAYWRIGHT_MODULE and PENSIEVE_UI_TEST_ALLOW_WRITES=1; use an isolated library only.");
}
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
page.setDefaultTimeout(30000);
const base = process.env.PENSIEVE_TEST_URL ?? "http://127.0.0.1:3111";
const errors = [];
page.on("pageerror", error => errors.push(error.message));
let queryRequests = 0;
page.on("request", request => { if (request.url().endsWith("/api/query")) queryRequests++; });
const read = async () => (await page.request.get(base + "/api/memories")).json();
const post = async data => {
  const response = await page.request.post(base + "/api/memories", { data });
  assert.equal(response.status(), 200);
  return response.json();
};
// Deliberately matches a UI dictionary key: content must never be translated.
const record = parseMemoryImport("Active", "text")[0];
record.keywords = ["Active", "astronomy"];
record.pinned = true;
record.risk_level = "low";
const initial = await read();
assert.ok(!initial.records.some(item => item.content === "Active"), "Use a fresh isolated test library");
await post({ operation: "import", revision: initial.revision, ...JSON.parse(exportMemoryJson([record])) });
try {
  await page.goto(base);
  await page.getByLabel("Interface language").selectOption("zh-CN");
  await page.getByRole("heading", { name: "看见记忆如何影响回答，决定哪些记忆应被保留与重视。" }).waitFor();
  for (const [href, heading] of [
    ["/guide", "如何理解 Pensieve"],
    ["/user-view", "当前记忆画像"],
    ["/surface-model", "基于提问的记忆观察"]
  ]) {
    await page.locator(`nav a[href="${href}"]`).click();
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  }
  await page.getByRole("button", { name: "唤起记忆", exact: true }).waitFor();
  await page.getByLabel("问题", { exact: true }).fill("Active");
  const resultPromise = page.waitForResponse(response => response.url().endsWith("/api/query"));
  await page.getByRole("button", { name: "唤起记忆", exact: true }).click();
  assert.equal((await resultPromise).status(), 200);
  await page.getByText("会话已完成", { exact: true }).waitFor();
  await page.getByText("已提交问题", { exact: true }).locator("..").getByText("Active", { exact: true }).waitFor();
  const answerText = page.locator("p.mt-4.text-slate-200");
  const answer = await answerText.innerText();
  const countBefore = queryRequests;
  await page.getByLabel("界面语言").selectOption("en");
  await page.getByRole("heading", { name: "Answer and memory summary" }).waitFor();
  assert.equal(await page.getByLabel("Query", { exact: true }).inputValue(), "Active");
  assert.equal(await answerText.innerText(), answer);
  assert.equal(queryRequests, countBefore);
  await page.getByLabel("Interface language").selectOption("zh-CN");
  await page.locator('nav a[href="/user-view"]').click();
  const card = page.locator("article").filter({ has: page.getByRole("heading", { name: "Active", exact: true }) });
  await card.getByRole("button", { name: "取消置顶", exact: true }).waitFor();
  await card.getByText("低风险", { exact: true }).waitFor();
  assert.equal((await read()).records.find(item => item.id === record.id).content, "Active");
  console.log("PASS routed Chinese UI, translated memory metadata, verbatim query/content/answer, no query on locale change");

  await page.goto(base + "/dashboard");
  await page.getByRole("heading", { name: "侧边栏适配器预览" }).waitFor();
  await page.getByRole("button", { name: "展开宿主面板", exact: true }).click();
  await page.getByRole("heading", { name: "结构化片段与管理" }).waitFor();
  await page.getByRole("button", { name: "隐藏", exact: true }).first().click();
  await page.getByRole("button", { name: "确认隐藏", exact: true }).waitFor();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.getByRole("button", { name: "隐藏侧边栏", exact: true }).click();
  await page.getByRole("heading", { name: "侧边栏已被宿主收起" }).waitFor();
  await page.getByRole("button", { name: "显示侧边栏", exact: true }).click();
  console.log("PASS dashboard expansion, hide confirmation and host visibility copy");

  await page.goto(base + "/plugin?host=codex");
  await page.getByRole("heading", { name: "Pensieve 插件内核" }).waitFor();
  await page.getByRole("button", { name: "展开", exact: true }).click();
  await page.getByRole("heading", { name: "来源追踪、存储路径与轻量管理" }).waitFor();
  await page.reload();
  assert.equal(await page.getByLabel("界面语言").inputValue(), "zh-CN");
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
  console.log("PASS plugin localized details and persistent html language");

  // Simulate a network failure locally; never call a live model.
  await page.goto(base + "/surface-model");
  await page.route("**/api/query", route => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Cannot query memory store / 无法查询记忆库" }) }));
  await page.getByLabel("问题", { exact: true }).fill("test failure");
  await page.getByRole("button", { name: "唤起记忆", exact: true }).click();
  await page.getByText("错误: Cannot query memory store / 无法查询记忆库", { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile surface must fit");
  await page.getByLabel("界面语言").focus();
  await page.keyboard.press("Tab");
  await page.screenshot({ path: ".next/locale-surface-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1365, height: 1000 });
  await page.goto(base + "/user-view");
  await page.getByRole("heading", { name: "当前记忆画像" }).waitFor();
  await page.screenshot({ path: ".next/locale-user-view.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("PASS localized failure, mobile layout, keyboard navigation and no runtime errors");
} catch (error) {
  await page.screenshot({ path: ".next/locale-failure.png", fullPage: true });
  console.error(await page.locator("body").innerText());
  throw error;
} finally {
  const current = await read();
  if (current.records.some(item => item.id === record.id)) await post({ operation: "delete", revision: current.revision, id: record.id });
  await browser.close();
}
