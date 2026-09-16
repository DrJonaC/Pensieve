import test from "node:test";
import assert from "node:assert/strict";
import { isSameOriginRequest } from "./request-safety.ts";

test("origin protection accepts the browser Host, not Next's internal hostname", () => {
  const request = new Request("http://localhost:3111/api/memories", {
    headers: { origin: "http://127.0.0.1:3111", host: "127.0.0.1:3111" }
  });
  assert.equal(isSameOriginRequest(request), true);
  assert.equal(isSameOriginRequest(new Request(request, { headers: { origin: "https://evil.test", host: "127.0.0.1:3111" } })), false);
  assert.equal(isSameOriginRequest(new Request(request, { headers: { "sec-fetch-site": "cross-site" } })), false);
});
