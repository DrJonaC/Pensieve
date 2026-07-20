import test from "node:test";
import assert from "node:assert/strict";

import { resolveHostAdapter } from "./resolve-host-adapter.ts";

test("resolveHostAdapter selects the Codex adapter from host hints", () => {
  const adapter = resolveHostAdapter("codex");
  assert.equal(adapter.kind, "codex");
  assert.equal(adapter.getContext().displayName, "Codex");
});

test("resolveHostAdapter selects the Claude Code adapter from host hints", () => {
  const adapter = resolveHostAdapter("claude-code");
  assert.equal(adapter.kind, "claude-code");
});

test("resolveHostAdapter falls back to the generic host adapter", () => {
  const adapter = resolveHostAdapter();
  assert.equal(adapter.kind, "generic");
});
