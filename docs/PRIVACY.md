# Credential protection / 凭据保护

Pensieve filters recognized credentials locally. No external redaction service is
used and switching interface language does not translate generated content.

## Protected boundaries

- Before a Live model request: query and selected memory content are filtered.
  Memory IDs are replaced with temporary aliases and mapped back after generation.
- After generation: answers, summaries, memory explanations and CDV reasons are
  filtered, including malformed model-output fallbacks and local mock narratives.
- Governance reports: narrative content is filtered before masking/truncation and
  before writing JSON and Markdown. Governance IDs and action states stay stable.
  Older reports are filtered when read; existing files are not rewritten.
- API errors and server logs: only a filtered message is returned/logged, not a
  complete upstream error object, headers or stack. UI error rendering provides a
  second filter and preserves the message's original language.
- The `/cdv-test` route was removed; production requests receive 404. Packaging
  also excludes nested `cdv-test` directories and no longer records build-machine
  absolute paths in the package manifest.

## Markers

`[REDACTED:API_KEY]`, `[REDACTED:SECRET]`, `[REDACTED:AUTH]`,
`[REDACTED:TOKEN]`, `[REDACTED:PRIVATE_KEY]`, `[REDACTED:CREDENTIAL]`.
Markers do not contain original credential fragments. Repeated filtering is
idempotent and does not translate surrounding text.

Coverage includes common API-token prefixes, JWTs, Bearer/Basic authorization,
PEM private keys, URL user/password credentials, labeled password/token/key
assignments (including Chinese labels). On the server, exact secret environment
values of at least eight characters are also filtered. Only credential-like
variable names are examined; values are never sent to browser components.

## Important limits

This is best-effort defense in depth, not complete secret detection or a general
PII classifier. Unknown formats, obfuscation/encoding, short unlabeled passwords,
names, emails, addresses and financial/medical facts may remain. False positives
are possible. Review output before sharing it; rotate any already-exposed keys.

The memory-management API/UI, query input, recalled source records, provenance,
JSON/text backups and exports remain original local user data. They are not
automatically sanitized or encrypted. Filtering generated output is not deletion
from storage, old reports, browser history, old logs or previous downloads.
Do not store credentials in memory. Review raw exports and backups before sharing.

The service remains single-user and loopback-only by default. This work does not
add authentication, authorization or make a publicly exposed deployment safe.

## 中文说明

模型输入以及回答、摘要、解释、治理报告中的可识别凭据会替换为上述标记。
错误详情保留原文语言，但也会遮蔽凭据；不记录完整异常对象或上游请求头。
原始记忆、查询输入、来源记录、导出与备份不被静默改写，仍可能包含敏感数据。
本功能不保证识别所有秘密，也不自动识别人名、邮箱、地址等个人信息。
已泄露密钥应撤销或轮换；分享前仍需人工审阅。开发诊断页已从路由与发布包移除。

## Verification

Unit tests cover credential formats, idempotence, language preservation, mock
fallbacks, structured response fields, environment-secret filtering and report
persistence. `scripts/check-privacy-ui.mjs` checks production 404, mock API/UI
redaction, original-memory preservation and external-error language behavior.
Run it only with an isolated `PENSIEVE_DATA_DIR`, `PLAYWRIGHT_MODULE` configured,
and `PENSIEVE_UI_TEST_ALLOW_WRITES=1`. It uses synthetic credentials, not real keys.

Verified locally: strict TypeScript, 72 unit tests, 4 package-policy checks,
production build, and privacy/localization/memory-management browser suites.
The production diagnostic URL returned 404. No live OpenAI request was made;
real-provider behavior is not part of this acceptance run.
