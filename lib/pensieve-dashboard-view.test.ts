import test from "node:test";
import assert from "node:assert/strict";

import {
  getDashboardShellMode,
  getVisibleMemoryRows
} from "./pensieve-dashboard-view.ts";
import { type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";

const memories: DashboardMemoryRecord[] = [
  {
    id: "memory-1",
    content: "The user prefers concise visual breakdowns.",
    keywords: ["concise", "visual", "breakdown"],
    priority_score: 0.82,
    risk_level: "low",
    status: "active",
    pinned: false,
    created_at: "2026-01-08T09:00:00.000Z",
    updated_at: "2026-07-04T10:00:00.000Z",
    last_activated: "2026-07-03T10:00:00.000Z",
    activation_count: 14
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
    activation_count: 11
  },
  {
    id: "memory-3",
    content: "The user explored sensitive profile inferences before.",
    keywords: ["sensitive", "privacy", "profile"],
    priority_score: 0.48,
    risk_level: "high",
    status: "active",
    pinned: false,
    created_at: "2026-03-14T14:05:00.000Z",
    updated_at: "2026-07-04T08:45:00.000Z",
    last_activated: "2026-07-01T10:00:00.000Z",
    activation_count: 4
  },
  {
    id: "memory-4",
    content: "The user often asks for modular architecture.",
    keywords: ["modular", "architecture"],
    priority_score: 0.44,
    risk_level: "low",
    status: "active",
    pinned: true,
    created_at: "2026-03-28T20:15:00.000Z",
    updated_at: "2026-07-04T08:15:00.000Z",
    last_activated: "2026-07-01T10:00:00.000Z",
    activation_count: 7
  },
  {
    id: "memory-5",
    content: "The user likes calm research-oriented aesthetics.",
    keywords: ["calm", "research", "aesthetic"],
    priority_score: 0.41,
    risk_level: "low",
    status: "active",
    pinned: false,
    created_at: "2026-03-30T20:15:00.000Z",
    updated_at: "2026-07-04T08:00:00.000Z",
    last_activated: "2026-07-01T10:00:00.000Z",
    activation_count: 5
  },
  {
    id: "memory-6",
    content: "The user wants privacy framing to stay explicit.",
    keywords: ["privacy", "framing"],
    priority_score: 0.31,
    risk_level: "medium",
    status: "active",
    pinned: false,
    created_at: "2026-04-01T20:15:00.000Z",
    updated_at: "2026-07-04T07:00:00.000Z",
    last_activated: "2026-07-01T10:00:00.000Z",
    activation_count: 3
  }
];

test("collapsed mode shows five memories to preserve a useful plugin overview", () => {
  const rows = getVisibleMemoryRows(memories, false);

  assert.equal(rows.length, 5);
  assert.equal(rows[0]?.id, "memory-1");
  assert.equal(rows[4]?.id, "memory-5");
});

test("expanded mode keeps the full memory set available for inspection", () => {
  const rows = getVisibleMemoryRows(memories, true);

  assert.equal(rows.length, 6);
  assert.equal(rows[5]?.id, "memory-6");
});

test("dashboard shell mode marks collapsed as overview and expanded as inspection", () => {
  assert.deepEqual(getDashboardShellMode(false), {
    keywordsLimit: 5,
    expanded: false,
    modeLabel: "overview"
  });
  assert.deepEqual(getDashboardShellMode(true), {
    keywordsLimit: 8,
    expanded: true,
    modeLabel: "inspection"
  });
});
