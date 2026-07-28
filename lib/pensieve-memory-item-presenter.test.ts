import test from "node:test";
import assert from "node:assert/strict";

import {
  presentDashboardMemoryItem,
  presentQueryMemoryItem,
  presentStructuredMemoryItem
} from "./pensieve-memory-item-presenter.ts";

test("presentQueryMemoryItem normalizes query memory display fields", () => {
  const presented = presentQueryMemoryItem({
    memory: {
      id: "memory-1",
      content: "The user prefers concise visual structure.",
      keywords: ["concise", "visual"],
      created_at: "2026-01-01T00:00:00.000Z",
      last_activated: "2026-07-28T12:00:00.000Z",
      activation_count: 4,
      relevance_score: 0.74,
      risk_level: "low",
      status: "active",
      pinned: true
    },
    explanation: "High keyword overlap.",
    priorityIndex: 1,
    cdv: {
      is_violation: true,
      severity: "warning",
      reason: "Minor drift."
    }
  });

  assert.equal(presented.priorityLabel, "Priority 1");
  assert.equal(presented.scorePercent, 74);
  assert.equal(presented.cdvLabel, "Context Drift");
});

test("presentDashboardMemoryItem preserves governed titles and governance metadata", () => {
  const presented = presentDashboardMemoryItem({
    id: "memory-1",
    content: "The user prefers concise visual structure.",
    keywords: ["concise", "visual"],
    priority_score: 0.82,
    risk_level: "medium",
    status: "softened",
    pinned: false,
    created_at: "2026-01-01T00:00:00.000Z",
    last_activated: "2026-07-28T12:00:00.000Z",
    activation_count: 6,
    info_type: "behavioral",
    origin_tp: "consent-required"
  });

  assert.equal(presented.governanceTierLabel !== undefined, true);
  assert.equal(presented.sourceLabel, "Consent Required");
  assert.equal(presented.lastActivatedLabel !== undefined, true);
});

test("presentStructuredMemoryItem exposes storage-oriented metadata for plugin views", () => {
  const presented = presentStructuredMemoryItem({
    id: "memory-1",
    content: "Structured plugin memory.",
    keywords: ["plugin", "memory"],
    status: "active",
    pinned: false,
    riskLevel: "high",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    lastActivatedAt: "2026-07-28T12:00:00.000Z",
    activationCount: 3,
    importance: 0.68,
    sourceEventIds: [],
    sourcePaths: [],
    storagePath: "records.json",
    metadata: {
      infoType: "identity",
      originTrustLevel: "confidentiality"
    }
  });

  assert.equal(presented.storageLabel, "records.json");
  assert.equal(presented.infoTypeLabel, "Identity");
  assert.equal(presented.sourceLabel, "Confidentiality");
});
