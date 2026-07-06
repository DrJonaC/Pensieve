import test from "node:test";
import assert from "node:assert/strict";

import {
  createDashboardState,
  type DashboardMemoryRecord
} from "./pensieve-dashboard-core.ts";

const records: DashboardMemoryRecord[] = [
  {
    id: "memory-1",
    content: "The user prefers concise visual breakdowns.",
    keywords: ["concise", "visual", "breakdown"],
    priority_score: 0.82,
    risk_level: "low",
    status: "active",
    pinned: true,
    created_at: "2026-01-08T09:00:00.000Z",
    updated_at: "2026-07-04T10:00:00.000Z",
    last_activated: "2026-07-03T10:00:00.000Z",
    activation_count: 14,
    info_type: "preference"
  },
  {
    id: "memory-2",
    content: "The user is building an AI memory transparency product.",
    keywords: ["ai", "memory", "transparency", "product"],
    priority_score: 0.76,
    risk_level: "medium",
    status: "softened",
    pinned: false,
    created_at: "2026-02-03T18:10:00.000Z",
    updated_at: "2026-07-04T09:30:00.000Z",
    last_activated: "2026-07-02T10:00:00.000Z",
    activation_count: 11,
    info_type: "behavioral"
  },
  {
    id: "memory-3",
    content: "The user explored sensitive profile inferences before.",
    keywords: ["sensitive", "privacy", "profile"],
    priority_score: 0.48,
    risk_level: "high",
    status: "hidden",
    pinned: false,
    created_at: "2026-03-14T14:05:00.000Z",
    updated_at: "2026-07-04T08:45:00.000Z",
    last_activated: "2026-07-01T10:00:00.000Z",
    activation_count: 4,
    info_type: "medical"
  }
];

test("createDashboardState derives snapshot counts and visible memory ordering", () => {
  const state = createDashboardState(records);

  assert.equal(state.snapshot.total_count, 3);
  assert.equal(state.snapshot.pinned_count, 1);
  assert.equal(state.snapshot.softened_count, 1);
  assert.equal(state.snapshot.hidden_count, 1);
  assert.equal(state.snapshot.high_risk_count, 1);
  assert.equal(state.derived.visible_memories.length, 2);
  assert.equal(state.memories[0]?.id, "memory-1");
});

test("createDashboardState derives top keywords and surfaced themes from visible memories", () => {
  const state = createDashboardState(records);

  assert.equal(state.derived.top_keywords[0]?.keyword, "concise");
  assert.equal(state.derived.surfaced_themes.length, 2);
  assert.ok(state.derived.surfaced_themes[0]?.label.includes(":"));
  assert.equal(state.derived.buckets.hidden[0]?.id, "memory-3");
});

test("createDashboardState returns stable empty collections when the memory field is empty", () => {
  const state = createDashboardState([]);

  assert.equal(state.snapshot.total_count, 0);
  assert.equal(state.snapshot.active_count, 0);
  assert.equal(state.derived.visible_memories.length, 0);
  assert.equal(state.derived.hidden_memories.length, 0);
  assert.equal(state.derived.top_keywords.length, 0);
  assert.equal(state.derived.surfaced_themes.length, 0);
});
