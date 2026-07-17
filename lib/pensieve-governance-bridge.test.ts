import test from "node:test";
import assert from "node:assert/strict";

import {
  createGovernanceReceipt,
  createGovernanceReport,
  renderGovernanceReportMarkdown
} from "./pensieve-governance-bridge.ts";
import { type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";

const baseline: DashboardMemoryRecord[] = [{
  id: "memory-1",
  content: "The user prefers concise answers.",
  keywords: ["concise"],
  priority_score: 0.8,
  risk_level: "low",
  status: "active",
  pinned: false,
  created_at: "2026-01-01T00:00:00.000Z",
  last_activated: "2026-01-01T00:00:00.000Z",
  activation_count: 1
}];

test("governance report captures final state changes without event history", () => {
  const report = createGovernanceReport({
    reportId: "governance-test",
    createdAt: "2026-07-17T12:00:00.000Z",
    provider: "local-file",
    baselineMemories: baseline,
    currentMemories: [{ ...baseline[0], pinned: true, status: "softened" }]
  });

  assert.deepEqual(report.changes[0]?.commands, ["pin", "soften"]);
  assert.equal(report.changes[0]?.after.status, "softened");
  assert.match(renderGovernanceReportMarkdown(report), /JSON manifest as the machine-readable source of truth/);
});

test("a previous report becomes the baseline for reversible changes", () => {
  const previous = createGovernanceReport({
    reportId: "governance-previous",
    createdAt: "2026-07-17T12:00:00.000Z",
    provider: "local-file",
    baselineMemories: baseline,
    currentMemories: [{ ...baseline[0], status: "hidden" }]
  });
  const restored = createGovernanceReport({
    reportId: "governance-restored",
    createdAt: "2026-07-17T13:00:00.000Z",
    provider: "local-file",
    baselineMemories: baseline,
    currentMemories: baseline,
    previousReport: previous
  });

  assert.deepEqual(restored.changes[0]?.commands, ["restore"]);
});

test("governance receipt detects provider drift", () => {
  const report = createGovernanceReport({
    reportId: "governance-test",
    createdAt: "2026-07-17T12:00:00.000Z",
    provider: "local-file",
    baselineMemories: baseline,
    currentMemories: [{ ...baseline[0], pinned: true }]
  });
  const receipt = createGovernanceReceipt({
    receiptId: "receipt-test",
    verifiedAt: "2026-07-17T12:01:00.000Z",
    report,
    memories: baseline
  });

  assert.equal(receipt.status, "drifted");
  assert.equal(receipt.items[0]?.status, "drifted");
});

test("governance artifacts preserve protected display rules", () => {
  const report = createGovernanceReport({
    reportId: "governance-protected",
    createdAt: "2026-07-17T12:00:00.000Z",
    provider: "local-file",
    baselineMemories: baseline,
    currentMemories: [{
      ...baseline[0],
      content: "A sensitive medical detail that must not be exported verbatim.",
      risk_level: "high",
      info_type: "medical",
      status: "hidden"
    }]
  });

  assert.equal(report.changes[0]?.content, "Protected medical memory");
  assert.doesNotMatch(renderGovernanceReportMarkdown(report), /sensitive medical detail/);
});
