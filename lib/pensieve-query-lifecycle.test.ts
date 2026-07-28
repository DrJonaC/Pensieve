import test from "node:test";
import assert from "node:assert/strict";

import {
  beginQuerySubmission,
  initialQuerySubmissionState,
  isStaleQueryResponse,
  settleQuerySubmission
} from "./pensieve-query-lifecycle.ts";

test("query submission lifecycle tracks active request and settle timestamps", () => {
  const started = beginQuerySubmission(
    initialQuerySubmissionState,
    "Show me the current memory field.",
    "2026-07-28T12:00:00.000Z",
    "live"
  );

  assert.equal(started.requestId, 1);
  assert.equal(started.pendingRequestId, 1);
  assert.equal(started.settledAt, null);

  const settled = settleQuerySubmission(started, 1, "2026-07-28T12:00:04.000Z", "live");
  assert.equal(settled.pendingRequestId, null);
  assert.equal(settled.settledAt, "2026-07-28T12:00:04.000Z");
  assert.equal(settled.latencyMs, 4000);
  assert.equal(settled.lastRequestedMode, "live");
  assert.equal(settled.lastResponseSource, "live");
});

test("stale responses cannot overwrite the newest request state", () => {
  const first = beginQuerySubmission(
    initialQuerySubmissionState,
    "First query",
    "2026-07-28T12:00:00.000Z",
    "live"
  );
  const second = beginQuerySubmission(first, "Second query", "2026-07-28T12:00:02.000Z", "mock");

  assert.equal(isStaleQueryResponse(second, first.requestId), true);

  const ignored = settleQuerySubmission(second, first.requestId, "2026-07-28T12:00:05.000Z", "live");
  assert.equal(ignored.pendingRequestId, second.requestId);
  assert.equal(ignored.settledAt, null);
});
