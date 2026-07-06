import test from "node:test";
import assert from "node:assert/strict";

import { createLocalMemoryProvider } from "./pensieve-local-provider.ts";

test("local provider returns snapshot and ranked memories from the persisted store", async () => {
  const provider = createLocalMemoryProvider();
  const snapshot = await provider.getSnapshot();
  const memories = await provider.getMemories();

  assert.equal(snapshot.total_count, 5);
  assert.equal(memories.length, 5);
  assert.equal(memories[0]?.id, "memory-1");
});

test("local provider applies pin, soften, hide, and restore actions", async () => {
  const provider = createLocalMemoryProvider();

  const pinned = await provider.applyAction({
    type: "pin",
    memory_id: "memory-2",
    value: true
  });
  assert.equal(pinned.changed_memory?.pinned, true);

  const softened = await provider.applyAction({
    type: "soften",
    memory_id: "memory-2",
    value: true
  });
  assert.equal(softened.changed_memory?.status, "softened");

  const hidden = await provider.applyAction({
    type: "hide",
    memory_id: "memory-2"
  });
  assert.equal(hidden.changed_memory?.status, "hidden");
  assert.equal(hidden.changed_memory?.pinned, false);

  const restored = await provider.applyAction({
    type: "restore",
    memory_id: "memory-2"
  });
  assert.equal(restored.changed_memory?.status, "active");
  assert.equal(restored.snapshot.hidden_count, 0);
});
