import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryDatabase,
  retrieveMemories,
  type MemoryRetrievalInput,
  type MemoryRetrievalModifierMap
} from "./memory-rag.ts";

const baseMemories: readonly MemoryRetrievalInput[] = [
  {
    id: "memory-1",
    content: "The user prefers concise breakdowns with strong visual structure.",
    keywords: ["concise", "breakdowns", "visual", "structure", "clear"],
    created_at: "2026-01-08T09:00:00.000Z",
    last_activated: "2026-04-08T13:20:00.000Z",
    activation_count: 14,
    base_importance: 0.82,
    risk_level: "low",
    status: "active"
  },
  {
    id: "memory-2",
    content: "The user is building an AI product centered on memory transparency and trust.",
    keywords: ["ai", "memory", "transparency", "trust", "product"],
    created_at: "2026-02-03T18:10:00.000Z",
    last_activated: "2026-04-07T16:45:00.000Z",
    activation_count: 11,
    base_importance: 0.76,
    risk_level: "medium",
    status: "active"
  },
  {
    id: "memory-3",
    content: "The user favors dark interfaces with calm, research-oriented aesthetics.",
    keywords: ["dark", "interface", "calm", "research", "minimal"],
    created_at: "2026-02-19T11:30:00.000Z",
    last_activated: "2026-04-05T08:00:00.000Z",
    activation_count: 9,
    base_importance: 0.63,
    risk_level: "low",
    status: "active"
  }
];

const defaultModifiers: MemoryRetrievalModifierMap = {
  "memory-1": { pinned: false, status: "active" },
  "memory-2": { pinned: false, status: "active" },
  "memory-3": { pinned: false, status: "active" }
};

test("retrieveMemories ranks the most semantically aligned memory first", () => {
  const database = createMemoryDatabase(baseMemories);

  const result = retrieveMemories({
    query: "How should I design a clear visual breakdown for this interface?",
    database,
    modifiers: defaultModifiers,
    topK: 2
  });

  assert.equal(result.topK.length, 2);
  assert.equal(result.topK[0]?.id, "memory-1");
  assert.ok(result.reasons["memory-1"].includes("visual"));
});

test("retrieveMemories excludes forgotten memories from TopK recall", () => {
  const database = createMemoryDatabase(baseMemories);

  const result = retrieveMemories({
    query: "How should I structure the interface?",
    database,
    modifiers: {
      ...defaultModifiers,
      "memory-1": { pinned: false, status: "forgotten" }
    },
    topK: 3
  });

  assert.equal(result.hiddenMemoryIds.includes("memory-1"), true);
  assert.equal(result.topK.some((memory) => memory.id === "memory-1"), false);
});

test("retrieveMemories applies pin boosts and soften penalties during reranking", () => {
  const database = createMemoryDatabase(baseMemories);

  const result = retrieveMemories({
    query: "I need help on memory transparency for my AI product",
    database,
    modifiers: {
      ...defaultModifiers,
      "memory-1": { pinned: true, status: "active" },
      "memory-2": { pinned: false, status: "softened" }
    },
    topK: 3
  });

  assert.equal(result.topK[0]?.id, "memory-1");
  assert.ok(result.reasons["memory-1"].includes("Pinned"));
  assert.ok(result.topK.find((memory) => memory.id === "memory-2"));
  assert.ok(result.reasons["memory-2"].includes("softened"));
});
