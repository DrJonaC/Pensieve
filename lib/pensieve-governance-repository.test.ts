import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  getGovernanceBridgeStatus,
  writeGovernanceReceipt,
  writeGovernanceReport
} from "./pensieve-governance-repository.ts";
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

test("governance repository writes reviewable and machine-readable artifacts", async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), "pensieve-governance-"));
  const options = {
    rootPath,
    now: () => new Date("2026-07-17T12:00:00.000Z"),
    idFactory: () => "12345678-fixed"
  };
  const artifact = await writeGovernanceReport({
    currentMemories: [{ ...baseline[0], pinned: true }],
    baselineMemories: baseline,
    provider: "local-file",
    options
  });

  assert.equal(artifact.report.changes.length, 1);
  assert.match(await readFile(path.join(rootPath, "reports", `${artifact.report.report_id}.md`), "utf8"), /Memory Governance Report/);

  const status = await getGovernanceBridgeStatus({
    currentMemories: [{ ...baseline[0], pinned: true }],
    baselineMemories: baseline,
    options
  });
  assert.equal(status.pending_change_count, 0);

  const receipt = await writeGovernanceReceipt({
    report: artifact.report,
    memories: [{ ...baseline[0], pinned: true }],
    options
  });
  assert.equal(receipt.status, "verified");
});
