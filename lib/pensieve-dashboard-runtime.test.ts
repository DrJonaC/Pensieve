import test from "node:test";
import assert from "node:assert/strict";

import { createLocalMemoryProvider } from "./pensieve-local-provider.ts";
import {
  applyDashboardAction,
  loadDashboardState
} from "./pensieve-dashboard-runtime.ts";

test("loadDashboardState combines snapshot and memories into a derived dashboard state", async () => {
  const provider = createLocalMemoryProvider();

  const state = await loadDashboardState(provider);

  assert.equal(state.snapshot.total_count, 5);
  assert.equal(state.memories.length, 5);
  assert.ok(state.derived.top_keywords.length > 0);
  assert.ok(state.derived.surfaced_themes.length > 0);
});

test("applyDashboardAction returns a refreshed dashboard state after a provider mutation", async () => {
  const provider = createLocalMemoryProvider();

  const state = await applyDashboardAction(provider, {
    type: "hide",
    memory_id: "memory-1"
  });

  assert.equal(state.snapshot.hidden_count, 1);
  assert.equal(state.derived.hidden_memories[0]?.id, "memory-1");
  assert.equal(state.derived.visible_memories.some((memory) => memory.id === "memory-1"), false);
});
