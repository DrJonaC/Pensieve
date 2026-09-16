import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { chineseCopy, localizeRelativeTime, translateUI } from "./ui-copy.ts";
import { presentRequestTrace } from "./pensieve-request-trace.ts";

test("UI copy switches language without changing unknown diagnostic text", () => {
  assert.equal(translateUI("en", "Active"), "Active");
  assert.equal(translateUI("zh-CN", "Active"), "活跃");
  assert.equal(translateUI("zh-CN", "Unknown provider error"), "Unknown provider error");
  assert.equal(translateUI("zh-CN", "toString"), "toString");
  assert.equal(localizeRelativeTime("zh-CN", "3h ago"), "3 小时前");
  assert.equal(localizeRelativeTime("zh-CN", "2d ago"), "2 天前");
  assert.equal(localizeRelativeTime("en", "3h ago"), "3h ago");
});

test("every literal ui call has an explicit Chinese translation", () => {
  const root = new URL("../components/", import.meta.url);
  const files = readdirSync(root, { recursive: true, encoding: "utf8" }).filter(file => file.endsWith(".tsx"));
  for (const file of files) {
    const source = readFileSync(new URL(file.replaceAll("\\", "/"), root), "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "ui") {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteral(argument)) {
          assert.ok(Object.hasOwn(chineseCopy, argument.text), `${file}: missing ${argument.text}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
});

test("query text matching a UI key is still marked as user content", () => {
  const trace = presentRequestTrace({
    requestId: 1, submittedAt: null, settledAt: null,
    lastSubmittedQuery: "Active", pendingRequestId: null,
    lastRequestedMode: "mock", lastResponseSource: "mock", latencyMs: null, outcome: "resolved"
  });
  assert.equal(trace.cards[0].value, "Active");
  assert.equal(trace.cards[0].isUserContent, true);
});
