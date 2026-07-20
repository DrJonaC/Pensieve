import test from "node:test";
import assert from "node:assert/strict";

import { getLocalMemoryProvider } from "./local-memory-provider.ts";

test("local memory provider exposes storage paths and current memories", async () => {
  const provider = getLocalMemoryProvider();
  const storage = await provider.getStorageInfo();
  const memories = await provider.listMemories();

  assert.equal(storage.providerName, "local-pensieve-store");
  assert.equal(memories.length > 0, true);
  assert.equal(memories[0]?.storagePath.includes("memory-store.ts"), true);
});

test("local memory provider applies lightweight governance actions", async () => {
  const provider = getLocalMemoryProvider();
  const firstMemory = (await provider.listMemories())[0];

  await provider.applyAction({ type: "hide", memoryId: firstMemory.id });
  let updated = (await provider.listMemories()).find((memory) => memory.id === firstMemory.id);
  assert.equal(updated?.status, "hidden");

  await provider.applyAction({ type: "restore", memoryId: firstMemory.id });
  updated = (await provider.listMemories()).find((memory) => memory.id === firstMemory.id);
  assert.equal(updated?.status, "active");
});
