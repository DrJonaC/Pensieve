import test from "node:test";
import assert from "node:assert/strict";

import { deriveMemoryPrioritySignals } from "./pensieve-memory-presenter.ts";
import type { StructuredMemoryRecord } from "./plugin-types.ts";

const memories: StructuredMemoryRecord[] = [
  {
    id: "memory-1",
    content: "Concise visual structure matters.",
    keywords: ["concise", "visual", "structure"],
    status: "active",
    pinned: true,
    riskLevel: "low",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    activationCount: 12,
    importance: 0.82,
    sourceEventIds: [],
    sourcePaths: [],
    storagePath: "memory-store.ts"
  },
  {
    id: "memory-2",
    content: "AI memory transparency should stay visible.",
    keywords: ["ai", "memory", "transparency"],
    status: "softened",
    pinned: false,
    riskLevel: "high",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    activationCount: 8,
    importance: 0.31,
    sourceEventIds: [],
    sourcePaths: [],
    storagePath: "memory-store.ts"
  },
  {
    id: "memory-3",
    content: "Hidden memory should not dominate visible priorities.",
    keywords: ["hidden", "private"],
    status: "hidden",
    pinned: false,
    riskLevel: "medium",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    activationCount: 4,
    importance: 0.7,
    sourceEventIds: [],
    sourcePaths: [],
    storagePath: "memory-store.ts"
  }
];

test("deriveMemoryPrioritySignals summarizes visible keyword, theme, and bucket layers", () => {
  const derived = deriveMemoryPrioritySignals({ memories, keywordLimit: 4, themeLimit: 3 });

  assert.equal(derived.topKeywords[0]?.keyword, "concise");
  assert.equal(derived.topThemes.length >= 2, true);
  assert.equal(derived.bucketSummary.active, 1);
  assert.equal(derived.bucketSummary.softened, 1);
  assert.equal(derived.bucketSummary.hidden, 1);
  assert.equal(derived.hasStrongMatch, true);
});
