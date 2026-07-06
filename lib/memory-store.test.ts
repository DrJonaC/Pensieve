import test from "node:test";
import assert from "node:assert/strict";

import {
  baseMemories,
  loadMemoryDatabase,
  memoryDatabaseSnapshot
} from "./memory-store.ts";
import { retrieveMemories } from "./memory-rag.ts";

test("loadMemoryDatabase hydrates persisted metadata and vector records", () => {
  const database = loadMemoryDatabase();

  assert.equal(database.metadataStore.size, baseMemories.length);
  assert.equal(database.vectorStore.size, baseMemories.length);
  assert.deepEqual(database.vocabulary, memoryDatabaseSnapshot.vocabulary);
});

test("hydrated memory database supports TopK retrieval without rebuilding vectors", () => {
  const database = loadMemoryDatabase();

  const result = retrieveMemories({
    query: "I need an AI product interface with clear memory transparency",
    database,
    modifiers: Object.fromEntries(
      baseMemories.map((memory) => [memory.id, { pinned: false, status: memory.status }])
    ),
    topK: 3
  });

  assert.equal(result.topK.length, 3);
  assert.equal(result.topK[0]?.id, "memory-2");
  assert.ok(result.reasons["memory-2"].length > 0);
});
