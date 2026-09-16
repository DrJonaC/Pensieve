import test from "node:test";
import assert from "node:assert/strict";
import { activateRepository } from "./repository-activation.ts";
import { parseMemoryImport } from "./memory-transfer.ts";

test("retrieval uses edited records, never the bundled or cached old content", () => {
  const records = parseMemoryImport("I build astronomy telescopes", "text");
  const before = activateRepository("astronomy", records);
  assert.equal(before.memories[0].content, records[0].content);
  const edited = records.map(m => ({ ...m, content: "I study marine biology", keywords: ["marine"] }));
  const after = activateRepository("marine", edited);
  assert.equal(after.memories[0].content, "I study marine biology");
  assert.ok(!JSON.stringify(after).includes("astronomy telescopes"));
});

test("hidden and deleted records cannot enter activation, heatmap or model context", () => {
  const records = parseMemoryImport("Private telescope plan", "text");
  const hidden = records.map(m => ({ ...m, status: "forgotten" as const, pinned: true }));
  for (const query of ["telescope", ""]) {
    const result = activateRepository(query, hidden);
    assert.equal(result.memories.length, 0);
    assert.equal(result.heatmap.length, 0);
    assert.equal(activateRepository(query, []).memories.length, 0);
  }
});

test("Unicode input survives tokenization", () => {
  const records = parseMemoryImport("喜欢简洁回答", "text");
  assert.ok(activateRepository("喜欢简洁回答", records).tokens.includes("喜欢简洁回答"));
});
