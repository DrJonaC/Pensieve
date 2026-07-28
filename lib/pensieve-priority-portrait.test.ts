import test from "node:test";
import assert from "node:assert/strict";

import { derivePensieveQueryView } from "./pensieve-query-view.ts";
import {
  presentDashboardPriorityPortrait,
  presentQueryPriorityPortrait
} from "./pensieve-priority-portrait.ts";
import { createDashboardState } from "./pensieve-dashboard-core.ts";
import type { ActivationResult } from "./memory.ts";

const activation: ActivationResult = {
  query: "Explain the memory field",
  response: "Mock answer",
  tokens: ["explain", "memory", "field"],
  memories: [
    {
      id: "memory-1",
      content: "Concise visual structure matters.",
      keywords: ["concise", "visual", "structure"],
      created_at: "2026-01-01T00:00:00.000Z",
      last_activated: "2026-07-28T12:00:00.000Z",
      activation_count: 4,
      relevance_score: 0.74,
      risk_level: "low",
      status: "active",
      pinned: true
    }
  ],
  reasons: {
    "memory-1": "High keyword overlap."
  },
  heatmap: [],
  hiddenMemoryIds: ["memory-2"]
};

test("presentQueryPriorityPortrait returns reusable bucket and chip presentation", () => {
  const view = derivePensieveQueryView({
    query: activation.query,
    result: activation,
    isLoading: false,
    error: null
  });
  const portrait = presentQueryPriorityPortrait(view);

  assert.equal(portrait.buckets[1]?.label, "Pinned");
  assert.equal(portrait.buckets[3]?.value, 1);
  assert.equal(portrait.keywords[0]?.tone, "strong");
});

test("presentDashboardPriorityPortrait adapts dashboard-derived data into the same shared shape", () => {
  const dashboard = createDashboardState([
    {
      id: "memory-1",
      content: "Concise visual structure matters.",
      keywords: ["concise", "visual", "structure"],
      priority_score: 0.82,
      risk_level: "low",
      status: "active",
      pinned: true,
      created_at: "2026-01-01T00:00:00.000Z",
      last_activated: "2026-07-28T12:00:00.000Z",
      activation_count: 5
    }
  ]);
  const portrait = presentDashboardPriorityPortrait(dashboard.derived);

  assert.equal(portrait.buckets[0]?.value, 1);
  assert.equal(portrait.themes.length > 0, true);
});
