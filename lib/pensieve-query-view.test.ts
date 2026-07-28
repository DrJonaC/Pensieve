import test from "node:test";
import assert from "node:assert/strict";

import { derivePensieveQueryView } from "./pensieve-query-view.ts";
import { type ActivationResult } from "./memory.ts";

const result: ActivationResult = {
  query: "Explain the memory transparency interface",
  response: "Mock answer",
  tokens: ["explain", "memory", "transparency", "interface"],
  memories: [
    {
      id: "memory-1",
      content: "The user prefers concise visual structure.",
      keywords: ["concise", "visual", "structure"],
      created_at: "2026-01-01T00:00:00.000Z",
      last_activated: "2026-07-28T12:00:00.000Z",
      activation_count: 4,
      relevance_score: 0.74,
      risk_level: "low",
      status: "active",
      pinned: true
    },
    {
      id: "memory-2",
      content: "The user is building a memory transparency product.",
      keywords: ["memory", "transparency", "product"],
      created_at: "2026-01-02T00:00:00.000Z",
      last_activated: "2026-07-28T12:00:00.000Z",
      activation_count: 3,
      relevance_score: 0.41,
      risk_level: "medium",
      status: "softened",
      pinned: false
    }
  ],
  reasons: {
    "memory-1": "High keyword overlap.",
    "memory-2": "Related product framing."
  },
  heatmap: [],
  hiddenMemoryIds: ["memory-3"]
};

test("derivePensieveQueryView summarizes keywords, themes, and buckets", () => {
  const view = derivePensieveQueryView({
    query: result.query,
    result,
    isLoading: false,
    error: null
  });

  assert.equal(view.visibleMemories.length, 2);
  assert.equal(view.hiddenCount, 1);
  assert.equal(view.bucketSummary.pinned, 1);
  assert.equal(view.bucketSummary.softened, 1);
  assert.equal(view.topKeywords[0]?.keyword.length > 0, true);
  assert.equal(view.topThemes.length > 0, true);
  assert.equal(view.hasStrongMatch, true);
  assert.equal(view.status, "resolved");
});

test("derivePensieveQueryView marks draft state when query and result diverge", () => {
  const view = derivePensieveQueryView({
    query: `${result.query} now`,
    result,
    isLoading: false,
    error: null
  });

  assert.equal(view.isQueryDirty, true);
  assert.equal(view.status, "draft");
});
