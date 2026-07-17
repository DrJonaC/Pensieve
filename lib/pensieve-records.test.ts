import test from "node:test";
import assert from "node:assert/strict";

import { createGovernanceReport } from "./pensieve-governance-bridge.ts";
import {
  applyGovernanceReportToRecords,
  toDashboardMemory
} from "./pensieve-records.ts";
import { type PersistedMemoryRecord } from "./memory-store.ts";

const record: PersistedMemoryRecord = {
  id: "memory-1",
  content: "The user prefers concise answers.",
  keywords: ["concise"],
  created_at: "2026-01-01T00:00:00.000Z",
  last_activated: "2026-01-01T00:00:00.000Z",
  activation_count: 1,
  base_importance: 0.8,
  pinned: false,
  risk_level: "low",
  status: "active"
};

test("governance report application converges records to the declared state", () => {
  const baseline = [toDashboardMemory(record)];
  const report = createGovernanceReport({
    reportId: "governance-test",
    createdAt: "2026-07-17T12:00:00.000Z",
    provider: "local-file",
    baselineMemories: baseline,
    currentMemories: [{ ...baseline[0], pinned: true, status: "softened" }]
  });
  const first = applyGovernanceReportToRecords([record], report);
  const second = applyGovernanceReportToRecords(first, report);

  assert.equal(first[0]?.pinned, true);
  assert.equal(first[0]?.status, "softened");
  assert.equal(second[0]?.pinned, true);
  assert.equal(second[0]?.status, "softened");
});
