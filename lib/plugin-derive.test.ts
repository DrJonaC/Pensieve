import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveKeywordPriority,
  deriveMemorySnapshot,
  deriveThemes
} from "./plugin-derive.ts";
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
    sourceEventIds: ["capture:memory-1"],
    sourcePaths: ["memory-store.ts"],
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
    importance: 0.75,
    sourceEventIds: ["capture:memory-2"],
    sourcePaths: ["memory-store.ts"],
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
    sourceEventIds: ["capture:memory-3"],
    sourcePaths: ["memory-store.ts"],
    storagePath: "memory-store.ts"
  }
];

test("deriveKeywordPriority prefers visible high-weight memory keywords", () => {
  const keywords = deriveKeywordPriority(memories, 4);

  assert.equal(keywords[0]?.keyword, "concise");
  assert.equal(keywords.some((entry) => entry.keyword === "hidden"), false);
});

test("deriveThemes returns compact grouped labels", () => {
  const themes = deriveThemes(memories, 3);

  assert.equal(themes.length >= 2, true);
  assert.equal(themes[0]?.memoryIds.includes("memory-1"), true);
});

test("deriveMemorySnapshot reports status counts and priority layers", () => {
  const snapshot = deriveMemorySnapshot(memories);

  assert.equal(snapshot.total, 3);
  assert.equal(snapshot.active, 1);
  assert.equal(snapshot.softened, 1);
  assert.equal(snapshot.hidden, 1);
  assert.equal(snapshot.pinned, 1);
  assert.equal(snapshot.highRisk, 1);
  assert.equal(snapshot.topKeywords.length > 0, true);
});
