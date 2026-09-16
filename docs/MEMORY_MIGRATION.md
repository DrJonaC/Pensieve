# Memory Library / 记忆迁移与管理

## Scope / 范围

Open **Memory Library / 记忆管理**. No query or model call is needed.
Import, editing, hiding, deletion and export operate on the same local JSON
repository used by User View, Surface Model and the shipped dashboard adapters.
They do not read or modify ChatGPT, Claude, Codex or Claude Code's private memory.
Only explicitly submitting a Live query sends recalled memory context to OpenAI,
after best-effort credential redaction. See PRIVACY.md for coverage and limits.
Local storage is not encrypted; run this single-user service on loopback only,
not on a public server without authentication and access control.

无需提问即可管理记忆。所有操作作用于 Pensieve 本地库，不自动同步宿主。
导入不调用模型，也不把文本推断为经过验证的事实。

## Import / 导入

Choose a file or paste text, preview, inspect duplicates/conflicts, then confirm.
Text: each nonempty line is one memory; optional bullet prefixes are removed.
Original text is kept, with source marked as user-imported and unverified.
No chat-history extraction or semantic merging is performed.
IDs or normalized identical content already in the library are skipped.
Conflicting IDs retain the existing record, never silently overwrite it.
Edit explicitly when you intend to change an existing record.

JSON contract: `{ "format": "pensieve-memory", "version": 1,
"exported_at": "<ISO timestamp>", "memories": [<PersistedMemoryRecord>] }`.
Required record fields: id, content, keywords, created_at, last_activated,
activation_count, base_importance, risk_level, status and pinned.
Optional provenance: updated_at, info_type, origin_context and origin_tp.
Legacy raw record arrays (including automatic .bak files) remain importable.
Unknown envelope versions are rejected.

Limits: 1 MB input; 2,000 total records; 10,000 characters per memory;
100 keywords of at most 200 characters each. The canonical library is limited
to 950 KB of compact UTF-8 JSON so a complete exported backup remains importable.
Client and server validate independently; failed validation leaves data unchanged.

纯文本按行分割。预览会标记新增、重复和 ID 冲突；已有内容优先。
非法格式、超限或过期版本不会覆盖当前库。

## Export and recovery / 导出与恢复

Select individual records or export all eligible records. Hidden and
high-risk/confidential records are excluded by default. For a full backup enable
both options and disable selection filtering. Risk labels are not a sensitive-data
detector: review the content yourself before sharing.
JSON preserves timestamps, provenance and governance state. Text exports only
content, with line breaks flattened, for manual migration and review.
Neither is advertised as a native ChatGPT/Claude backup format.
Use only a destination app's documented import/paste capability; check the result
there. Uploading a file as chat context does not necessarily create saved memory.

Hide removes a record from retrieval and can be restored. Delete removes it from
the active store, after confirmation; it is not secure erasure of existing backups.
Before every write, a full .bak is saved beside the repository. The UI can download
the immediately preceding snapshot, including hidden/sensitive records.
Reimport restores missing records but does NOT undo edits to existing IDs.
For one edited memory, open the backup and explicitly edit the current record.
For complete rollback: stop all Pensieve processes, preserve the current file,
replace it with a validated .bak, then restart. Never do this while writes run.
The existing Undo control restores the most recent governance change in this
session; external mutations clear this history. Reset clears pin/soften state but
does not unhide records. Use Restore explicitly for hidden memories.

隐藏可恢复；删除前有确认且自动备份，因此不代表备份中的敏感内容被彻底擦除。
重新导入只合并缺少的记录；回滚已有内容需手动编辑或停服后恢复完整备份。

## Persistence and limits / 持久化与边界

Default file: data/pensieve-memory-records.json; set PENSIEVE_DATA_DIR to relocate
the directory. A new installation seeds explicitly bundled sample memories.
Malformed existing files produce an error and are never reset automatically.
Writes use a cross-process exclusive lock, a revision check for edits/imports,
write-before-rename atomic replacement and a pre-change backup.
A crash may leave a .lock: stop every writer and inspect the store/backup before
manually removing that lock. It is never automatically stolen.
Backups are unencrypted and retained locally; manage their retention yourself.
Git and plugin packaging exclude runtime data, backups and environment secrets.

Retrieval currently uses a local lexical vector index, rebuilt from the current
records, not an external semantic embedding service. The heatmap and activation
counters remain illustrative, not measurements of internal model attention.
Edits replace indexed content; hidden/deleted records cannot enter model context.

English/Chinese switching covers navigation, Memory Library, Home, Guide, User
View, Surface Model, dashboard and plugin controls, including status labels,
empty states, confirmations and built-in error guidance. Language choice persists
locally and updates html.lang. Switching language does not submit another query
or alter stored memory, query text, keywords, themes, answers or explanations.
UI-only copy lives in lib/ui-copy.ts; the existing t(en, zh) helper remains
available for contextual and parameterized messages.

Language boundaries: generated answers and explanations (including local mock
output and CDV reasoning), imported/source content, paths, model/provider IDs and
unknown external diagnostic messages retain their original language. The developer
exported governance reports and framework default 404 page are not localized.
The /cdv-test diagnostic route has been removed. No automatic translation service is used.

中英文已覆盖主要页面与记忆管理流程。切换语言不重新提问，也不翻译或改写
记忆、关键词、主题和生成内容。开发诊断页已移除；治理报告及框架默认 404 页
仍保留原文。外部错误详情保留原文语言，但会遮蔽可识别的凭据。

## Verification

Dependency review (2026-09-16): Next.js 15.5.25, React/React DOM 19.1.9,
PostCSS 8.5.28 and refreshed compatible transitive dependencies are locked.
Next.js 15 pins an older PostCSS, so a scoped npm override makes Next use the
same patched PostCSS 8 as the app. Revisit this override when upgrading Next.
A clean npm ci completed with zero reported vulnerabilities. This is a dated
dependency audit, not a guarantee of overall application security. The app still
requires authentication and access control before any public deployment.
[Next.js security advisory](https://nextjs.org/blog/august-2026-security-release).

Run npm run typecheck, npm test, and npm run test:package.
UI acceptance can be run with scripts/check-memory-ui.mjs against an isolated
local server. Set PLAYWRIGHT_MODULE to an available Playwright installation; this
is an optional development tool, not a runtime dependency. Never run the
acceptance script against a personal memory library.

scripts/check-locale-ui.mjs uses the same settings and verifies routed Chinese
copy, language persistence, unchanged user content and answers, dashboard hide
confirmation, plugin details, a simulated network failure and mobile layout.
It imports then removes a sentinel memory named "Active" in the isolated library
to catch accidental translation of user content that matches a UI dictionary key.

Current checks: strict TypeScript; unit tests for import validation, roundtrip,
retrieval invalidation, hidden/deleted exclusion, revision conflicts and corrupt
files; package privacy tests; HTTP acceptance; desktop/mobile browser interaction.
Real OpenAI requests are deliberately not part of these checks.

The 2026-09-16 dependency update also passed a production build, 64 unit tests,
4 package checks and HTTP/browser acceptance against the production server using
an isolated library. Typecheck generates Next.js route types before invoking tsc,
so a clean checkout does not depend on an existing build cache. CI includes the
production build with telemetry disabled. No memory content was sent to a model.

The subsequent UI localization pass passed strict TypeScript, 67 unit tests,
4 package checks, the production build, HTTP acceptance, the existing migration
browser suite and the new locale browser suite. Desktop and mobile screenshots
were inspected. All browser writes used an isolated test library; no live model
requests were made.
