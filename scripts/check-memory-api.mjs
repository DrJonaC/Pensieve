import assert from "node:assert/strict";
import { parseMemoryImport, exportMemoryJson } from "../lib/memory-transfer.ts";

if (process.env.PENSIEVE_UI_TEST_ALLOW_WRITES !== "1") throw new Error("Use an isolated server and explicitly allow test writes.");
const base = process.env.PENSIEVE_TEST_URL ?? "http://127.0.0.1:3111";
const read = async () => (await fetch(base + "/api/memories")).json();
const post = async payload => {
  const response = await fetch(base + "/api/memories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  return { status: response.status, body: await response.json() };
};
const initial = await read();
const record = parseMemoryImport("API acceptance " + crypto.randomUUID(), "text")[0];
record.status = "forgotten";
record.pinned = true;
record.risk_level = "high";
const imported = await post({ operation: "import", revision: initial.revision, ...JSON.parse(exportMemoryJson([record])) });
assert.equal(imported.status, 200);
assert.deepEqual(imported.body.records.find(m => m.id === record.id), record);
try {
  const duplicate = await post({ operation: "import", revision: imported.body.revision, ...JSON.parse(exportMemoryJson([record])) });
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.records.length, imported.body.records.length);
  const invalid = await post({ operation: "import", revision: duplicate.body.revision, format: "pensieve-memory", version: 1, memories: [{ ...record, status: "invalid" }] });
  assert.equal(invalid.status, 400);
  assert.equal((await read()).revision, duplicate.body.revision);
  const stale = await post({ operation: "edit", revision: initial.revision, id: record.id, content: "stale", keywords: [] });
  assert.equal(stale.status, 409);
  const deleted = await post({ operation: "delete", revision: duplicate.body.revision, id: record.id });
  assert.equal(deleted.status, 200);
  const restored = await post({ operation: "import", revision: deleted.body.revision, ...JSON.parse(exportMemoryJson([record])) });
  assert.equal(restored.status, 200);
  assert.deepEqual(restored.body.records.find(m => m.id === record.id), record);
  const badVersion = await post({ operation: "import", revision: restored.body.revision, format: "pensieve-memory", version: 99, memories: [] });
  assert.equal(badVersion.status, 400);
  const oversized = await post({ operation: "import", revision: restored.body.revision, format: "pensieve-memory", version: 1, memories: [], padding: "x".repeat(2_000_001) });
  assert.equal(oversized.status, 400);
  const crossSite = await fetch(base + "/api/memories", { method: "POST", headers: { Origin: "https://untrusted.example", "Content-Type": "application/json" }, body: "{}" });
  assert.equal(crossSite.status, 403);
  console.log("PASS HTTP metadata roundtrip, idempotency, invalid input isolation, stale-write rejection, version and size limits, origin protection");
} finally {
  const current = await read();
  if (current.records.some(m => m.id === record.id)) {
    assert.equal((await post({ operation: "delete", revision: current.revision, id: record.id })).status, 200);
  }
}
