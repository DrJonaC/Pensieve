import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { redactGeneratedResponse, redactSensitiveText } from "./privacy.ts";
import { configuredSecrets, safeErrorMessage } from "./privacy-server.ts";
import { buildMockNarrative, mergeMemoryExplanationMap } from "./query.ts";
import { activateRepository } from "./repository-activation.ts";
import { parseMemoryImport } from "./memory-transfer.ts";
import { toDashboardMemory } from "./pensieve-records.ts";
import { writeGovernanceReport } from "./pensieve-governance-repository.ts";

const fakeKey = "sk-proj-" + "unit-test-not-a-real-key-12345678";

test("redaction detects credentials and is idempotent without translating surrounding text", () => {
  for (const [input, hidden] of [
    [`English key: ${fakeKey}。请检查。`, fakeKey],
    ['{"password":"a \\"quoted\\" secret"}', "quoted"],
    ['密码："中文测试密码"', "中文测试密码"],
    ["API key: unprefixed-test-value", "unprefixed-test-value"],
    ["Authorization: Bearer unit-token-not-real", "unit-token-not-real"],
    ["Authorization: Basic dW5pdDp0ZXN0", "dW5pdDp0ZXN0"],
    ["https://user:fake-password@localhost/private?token=test-token&limit=3", "fake-password"],
    ["eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.fake_signature", "eyJhbGci"],
    ["-----BEGIN PRIVATE KEY-----\nsynthetic-private-body\n-----END PRIVATE KEY-----", "synthetic-private-body"],
    ["-----BEGIN RSA PRIVATE KEY-----\ntruncated-private-body", "truncated-private-body"]
  ]) {
    const result = redactSensitiveText(input);
    assert.ok(!result.includes(hidden), `Credential was not removed: ${hidden}`);
    assert.match(result, /\[REDACTED:/);
    assert.equal(redactSensitiveText(result), result);
  }
  assert.equal(redactSensitiveText("你好 Active, token count: 42; max_tokens=100"), "你好 Active, token count: 42; max_tokens=100");
});

test("server errors mask configured credentials without serializing error objects or changing language", () => {
  const name = "PENSIEVE_TEST_SECRET";
  const previous = process.env[name];
  process.env[name] = "unprefixed-server-unit-secret";
  try {
    assert.ok(configuredSecrets().includes(process.env[name]));
    const error = new Error(`External service rejected ${process.env[name]}`);
    assert.equal(safeErrorMessage(error, "Fallback"), "External service rejected [REDACTED:SECRET]");
    assert.equal(safeErrorMessage({}, "Fallback"), "Fallback");
  } finally {
    if (previous === undefined) delete process.env[name]; else process.env[name] = previous;
  }
});

test("structured redaction preserves identifiers, metadata and original inputs", () => {
  const input = { answer: fakeKey, summary: `摘要 ${fakeKey}`, memory_explanations: [{ memory_id: "m1", why: fakeKey }],
    cdv_results: { m1: { reason: fakeKey, severity: "warning", is_violation: true } } };
  const output = redactGeneratedResponse(input);
  assert.ok(!JSON.stringify(output).includes(fakeKey));
  assert.equal(output.memory_explanations[0].memory_id, "m1");
  assert.equal(output.cdv_results.m1.is_violation, true);
  assert.equal(input.answer, fakeKey);
  assert.match(output.summary, /^摘要 /);
});

test("mock narratives and local explanation fallbacks cannot bypass credential redaction", () => {
  const records = parseMemoryImport(`astronomy ${fakeKey}`, "text");
  const activation = activateRepository("astronomy", records);
  activation.response = fakeKey;
  activation.reasons[records[0].id] = fakeKey;
  assert.ok(!JSON.stringify(buildMockNarrative(activation)).includes(fakeKey));
  assert.ok(!JSON.stringify(mergeMemoryExplanationMap(activation.reasons, [])).includes(fakeKey));
  assert.ok(records[0].content.includes(fakeKey));
});

test("governance JSON and Markdown are redacted before persistence without changing action state", async () => {
  const rootPath = await mkdtemp(path.join(tmpdir(), "pensieve-privacy-"));
  const record = toDashboardMemory(parseMemoryImport(`astronomy ${fakeKey}`, "text")[0]);
  try {
    const artifact = await writeGovernanceReport({
      baselineMemories: [record], currentMemories: [{ ...record, pinned: true }], provider: "unit-test",
      options: { rootPath }
    });
    for (const file of [artifact.manifest_path, artifact.markdown_path]) {
      const content = await readFile(path.resolve(file), "utf8");
      assert.ok(!content.includes(fakeKey));
      assert.match(content, /\[REDACTED:API_KEY\]/);
    }
    assert.equal(artifact.report.resulting_state[0].pinned, true);
    assert.ok(record.content.includes(fakeKey));
  } finally { await rm(rootPath, { recursive: true, force: true }); }
});
