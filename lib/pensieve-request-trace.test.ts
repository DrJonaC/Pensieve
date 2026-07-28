import test from "node:test";
import assert from "node:assert/strict";

import { presentRequestTrace } from "./pensieve-request-trace.ts";
import type { QuerySubmissionState } from "./pensieve-query-lifecycle.ts";

test("presentRequestTrace exposes the latest query, mode, source, and latency", () => {
  const trace = presentRequestTrace({
    requestId: 2,
    submittedAt: "2026-07-28T12:00:00.000Z",
    settledAt: "2026-07-28T12:00:01.250Z",
    lastSubmittedQuery: "Show the memory field.",
    pendingRequestId: null,
    lastRequestedMode: "live",
    lastResponseSource: "live",
    latencyMs: 1250,
    outcome: "resolved"
  } satisfies QuerySubmissionState);

  assert.equal(trace.statusLabel, "Settled");
  assert.equal(trace.cards[0]?.value, "Show the memory field.");
  assert.equal(trace.cards[2]?.value, "LIVE");
});
