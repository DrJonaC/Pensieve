import test from "node:test";
import assert from "node:assert/strict";

import { baseMemories } from "./memory.ts";
import {
  createInitialSessionState,
  markForgotten,
  restoreForgottenMemories,
  togglePinned,
  toggleSoftened,
  undoLastSessionAction
} from "./memory-state.ts";

test("memory session actions remain reversible", () => {
  const initial = createInitialSessionState(baseMemories, "Explain memory transparency");
  const pinned = togglePinned(initial, baseMemories, "memory-1");
  const softened = toggleSoftened(pinned, baseMemories, "memory-2");
  const hidden = markForgotten(softened, baseMemories, "memory-3");
  const restored = restoreForgottenMemories(hidden, baseMemories);

  assert.equal(restored.modifiers["memory-1"]?.pinned, true);
  assert.equal(restored.modifiers["memory-2"]?.status, "softened");
  assert.equal(restored.modifiers["memory-3"]?.status, "active");

  const undone = undoLastSessionAction(restored);
  assert.equal(undone.modifiers["memory-3"]?.status, "forgotten");
});
