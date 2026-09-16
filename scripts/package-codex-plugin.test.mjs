import test from "node:test";
import assert from "node:assert/strict";

import { PACKAGE_INCLUDE, isSafePackagePath } from "./package-codex-plugin.mjs";
import path from "node:path";

test("recursive package filter excludes backups and nested secrets", () => {
  for (const file of ["lib/private.bak", "lib/.env.production", "codex-marketplace/plugins/example/data/memory.json", "app/cdv-test/page.tsx", "codex-marketplace/plugins/example/app/cdv-test/page.tsx"]) {
    assert.equal(isSafePackagePath(path.resolve(file)), false);
  }
  assert.equal(isSafePackagePath(path.resolve("lib/memory.ts")), true);
});

test("runtime data, backups and credentials are excluded from plugin package", () => {
  for (const entry of ["data", ".env", ".env.local", ".next", "node_modules"]) {
    assert.equal(PACKAGE_INCLUDE.includes(entry), false);
  }
});

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
