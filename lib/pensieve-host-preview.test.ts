import test from "node:test";
import assert from "node:assert/strict";

import {
  HOST_CAPTURE_LIMIT,
  HOST_CAPTURE_REFRESH_INTERVAL,
  shouldRefreshCaptureDisplay
} from "./pensieve-host-preview.ts";

test("capture display only refreshes at the configured interval", () => {
  assert.equal(shouldRefreshCaptureDisplay(1), false);
  assert.equal(shouldRefreshCaptureDisplay(HOST_CAPTURE_REFRESH_INTERVAL - 1), false);
  assert.equal(shouldRefreshCaptureDisplay(HOST_CAPTURE_REFRESH_INTERVAL), true);
  assert.equal(shouldRefreshCaptureDisplay(HOST_CAPTURE_REFRESH_INTERVAL * 2), true);
});

test("capture display refreshes when the capture limit is reached", () => {
  assert.equal(shouldRefreshCaptureDisplay(HOST_CAPTURE_LIMIT - 1), false);
  assert.equal(shouldRefreshCaptureDisplay(HOST_CAPTURE_LIMIT), true);
  assert.equal(shouldRefreshCaptureDisplay(HOST_CAPTURE_LIMIT + 1), true);
});
