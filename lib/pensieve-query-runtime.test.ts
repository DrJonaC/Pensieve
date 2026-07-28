import test from "node:test";
import assert from "node:assert/strict";

import { createDefaultMemoryModifiers } from "./memory.ts";
import { prepareQueryExecution } from "./pensieve-query-runtime.ts";
import { baseMemories } from "./memory.ts";

test("prepareQueryExecution creates a live request plan for non-empty live queries", () => {
  const plan = prepareQueryExecution({
    query: "Explain the memory transparency architecture",
    modifiers: createDefaultMemoryModifiers(baseMemories),
    mode: "live"
  });

  assert.equal(plan.shouldRequestLive, true);
  assert.equal(plan.partitioned !== null, true);
  assert.equal(plan.activation.query, "Explain the memory transparency architecture");
});

test("prepareQueryExecution stays dormant for empty queries", () => {
  const plan = prepareQueryExecution({
    query: "   ",
    modifiers: createDefaultMemoryModifiers(baseMemories),
    mode: "mock"
  });

  assert.equal(plan.shouldRequestLive, false);
  assert.equal(plan.partitioned, null);
  assert.equal(plan.activation.tokens.length, 0);
});
