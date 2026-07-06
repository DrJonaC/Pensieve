import test from "node:test";
import assert from "node:assert/strict";

import { createMockPensieveHostAdapter } from "./pensieve-mock-host.ts";

test("mock host adapter exposes default context and host state", async () => {
  const adapter = createMockPensieveHostAdapter();

  const context = await adapter.getContext();
  const state = await adapter.getHostState();

  assert.equal(context.host_name, "mock-host");
  assert.equal(context.query_mode, "query-free");
  assert.equal(state.visible, true);
  assert.equal(state.expanded, false);
  assert.equal(state.width, 384);
});

test("mock host adapter notifies subscribers when host context and state change", () => {
  const adapter = createMockPensieveHostAdapter();
  const receivedTypes: string[] = [];

  const unsubscribe = adapter.subscribe((event) => {
    receivedTypes.push(event.type);
  });

  adapter.setContext({
    workspace_id: "workspace-beta"
  });
  adapter.setHostState({
    width: 512
  });
  adapter.setVisible(false);
  unsubscribe();

  assert.deepEqual(receivedTypes, [
    "host.context.updated",
    "host.sidebar.updated",
    "host.visibility.changed"
  ]);
});

test("mock host adapter records plugin events and mirrors expanded changes into host state", async () => {
  const adapter = createMockPensieveHostAdapter();

  await adapter.emit({
    type: "plugin.expanded.changed",
    source: "plugin",
    payload: {
      expanded: true
    },
    timestamp: new Date().toISOString()
  });

  const events = adapter.getEvents();
  const state = await adapter.getHostState();

  assert.equal(events.length, 1);
  assert.equal(events[0]?.type, "plugin.expanded.changed");
  assert.equal(state.expanded, true);
  assert.equal(state.width, 672);
});

