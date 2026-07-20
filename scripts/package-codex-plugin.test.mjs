import test from "node:test";
import assert from "node:assert/strict";

import { PACKAGE_INCLUDE } from "./package-codex-plugin.mjs";

test("package include list keeps the Codex manifest and core runtime directories", () => {
  assert.equal(PACKAGE_INCLUDE.includes(".codex-plugin"), true);
  assert.equal(PACKAGE_INCLUDE.includes("app"), true);
  assert.equal(PACKAGE_INCLUDE.includes("components"), true);
  assert.equal(PACKAGE_INCLUDE.includes("codex-marketplace"), true);
  assert.equal(PACKAGE_INCLUDE.includes("lib"), true);
  assert.equal(PACKAGE_INCLUDE.includes("package.json"), true);
});

test("package include list keeps installation docs for plugin consumers", () => {
  assert.equal(PACKAGE_INCLUDE.includes("CODEX_PLUGIN_INSTALL.md"), true);
  assert.equal(PACKAGE_INCLUDE.includes("README.md"), true);
  assert.equal(PACKAGE_INCLUDE.includes("README.zh-CN.md"), true);
});
