import test from "node:test";
import assert from "node:assert/strict";

import {
  getGovernedMemoryDisplay,
  resolveDashboardVisibilityTier
} from "./pensieve-governance.ts";
import { type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";

const fullMemory: DashboardMemoryRecord = {
  id: "memory-1",
  content: "The user prefers concise visual breakdowns with strong visual structure.",
  keywords: ["concise", "visual", "structure"],
  priority_score: 0.82,
  risk_level: "low",
  status: "active",
  pinned: false,
  created_at: "2026-01-08T09:00:00.000Z",
  last_activated: "2026-07-03T10:00:00.000Z",
  activation_count: 14,
  info_type: "preference",
  origin_tp: "public"
};

const softMaskMemory: DashboardMemoryRecord = {
  id: "memory-2",
  content: "The user is building an AI memory transparency product with privacy tradeoffs in view.",
  keywords: ["ai", "memory", "privacy", "product"],
  priority_score: 0.76,
  risk_level: "medium",
  status: "active",
  pinned: false,
  created_at: "2026-02-03T18:10:00.000Z",
  last_activated: "2026-07-02T10:00:00.000Z",
  activation_count: 11,
  info_type: "behavioral",
  origin_tp: "consent-required"
};

const protectedMemory: DashboardMemoryRecord = {
  id: "memory-3",
  content: "The user explored sensitive profile inferences before in a medical context.",
  keywords: ["sensitive", "profile", "medical"],
  priority_score: 0.48,
  risk_level: "high",
  status: "active",
  pinned: false,
  created_at: "2026-03-14T14:05:00.000Z",
  last_activated: "2026-07-01T10:00:00.000Z",
  activation_count: 4,
  info_type: "medical",
  origin_tp: "confidentiality"
};

test("visibility tier resolves to the strictest signal across risk, origin, and info type", () => {
  assert.equal(resolveDashboardVisibilityTier(fullMemory), "full");
  assert.equal(resolveDashboardVisibilityTier(softMaskMemory), "soft-mask");
  assert.equal(resolveDashboardVisibilityTier(protectedMemory), "protected");
});

test("governed display preserves full content for low sensitivity memories", () => {
  const display = getGovernedMemoryDisplay(fullMemory);

  assert.equal(display.tier, "full");
  assert.equal(display.content, fullMemory.content);
  assert.deepEqual(display.keywords, ["concise", "visual", "structure"]);
  assert.equal(display.hide_confirmation_tier, "soft");
});

test("governed display soft-masks medium sensitivity memories", () => {
  const display = getGovernedMemoryDisplay(softMaskMemory);

  assert.equal(display.tier, "soft-mask");
  assert.match(display.content, /\.\.\.$/);
  assert.equal(display.keywords.includes("Behavioral"), true);
  assert.equal(display.hide_confirmation_tier, "soft");
});

test("governed display protects high sensitivity memories with abstracted content and keywords", () => {
  const display = getGovernedMemoryDisplay(protectedMemory);

  assert.equal(display.tier, "protected");
  assert.equal(display.content, "Protected medical memory");
  assert.deepEqual(display.keywords, ["Protected", "Medical", "Confidentiality"]);
  assert.equal(display.hide_confirmation_tier, "strong");
});

