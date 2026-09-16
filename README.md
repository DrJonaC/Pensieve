<div align="center">

# Pensieve: Know How AI Remembers You

**Inspect. Migrate. Govern.**

A local-first workspace for structured AI memory, with a plugin-ready dashboard.

[English](README.md) · [简体中文](README.zh-CN.md) · [Migration guide](docs/MEMORY_MIGRATION.md) · [Privacy](docs/PRIVACY.md)

![MIT](https://img.shields.io/badge/license-MIT-718b84?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15.5-263d38?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-789fa3?style=flat-square)
![Status](https://img.shields.io/badge/status-local%20research%20preview-a8bab4?style=flat-square)

![Pensieve concept illustration, not a product screenshot](docs/assets/pensieve-hero.png)

</div>

## Why Pensieve?

Memory can shape an assistant's answers, but users need more than a hidden store:
they need to inspect what was retained, understand what surfaced, and change it.
Pensieve brings **observability, portability and user control** into one local interface.

Pensieve manages **external structured memory**, not model weights or internal attention.
The shipped adapters use Pensieve's own repository. They do not automatically read or
modify private ChatGPT, Claude, Codex or Claude Code memories.

## What's New

| Capability | What you can do |
| --- | --- |
| Memory Library | Import versioned JSON or plain text without asking a question; preview additions, duplicates and conflicts |
| Portable backups | Export selected or eligible records as JSON or text; preserve metadata in JSON |
| Editing and governance | Edit content/keywords, pin, soften, hide, restore or confirm deletion; changes affect actual retrieval |
| Safer persistence | Revision checks, exclusive write locks, atomic file replacement and pre-change backups |
| English / Chinese | Switch interface language without translating your memories or generated answers |
| Credential protection | Replace recognized credentials with `[REDACTED:...]` in model input, generated text, reports and errors |
| Release hygiene | Runtime data and secrets excluded from packages; developer diagnostic route removed |

## Explore the App

| Route | Purpose |
| --- | --- |
| `/` | Overview, current session and entry points |
| `/memories` | Import → preview → confirm → manage → export |
| `/guide` | Concepts and operating guidance |
| `/user-view` | Priority keywords, themes and ranked memory cards |
| `/surface-model` | Mock/Live queries, answers, explanations, request trace and simulated heatmap |
| `/dashboard` | Query-free dashboard and mock host preview |
| `/plugin` | Host-adapter preview; not a native host-memory connection |

![Pensieve overview with bundled sample data](docs/assets/home-overview.png)

## Quick Start

Use Node.js 22.18+ (Node 22 LTS is used in CI).

```bash
git clone https://github.com/DrJonaC/Pensieve.git
cd Pensieve
npm ci
npm run dev
```

Open **http://127.0.0.1:3000/memories**. A new library starts with bundled sample
memories. No API key is needed for memory management or Mock mode.

For optional Live mode, create `.env.local` in the project root:

```dotenv
OPENAI_API_KEY=your_api_key_here
```

The server uses the OpenAI Responses API. Only explicitly submitting a Live query
sends the filtered query and selected memory context to the model. Never commit
`.env.local`. Restart the app after changing server configuration.

```bash
npm run build
npm run start
```

Both local commands bind to loopback. This is a single-user application, **not an
authenticated public service**. Do not expose it publicly without access controls.

## How It Works

```text
JSON / text → validated preview → shared file repository
                                    ↓
                 dashboard / memory management / local retrieval
                                    ↓
                   Mock answer or filtered server-side LLM call
                                    ↓
                    answer + explanation + simulated heatmap
```

- The default store is `data/pensieve-memory-records.json`; `PENSIEVE_DATA_DIR`
  can relocate runtime data, including governance reports.
- Retrieval uses a local lexical vector index rebuilt from current records,
  followed by ranking modifiers. It is not an external semantic embedding service.
- Hidden/deleted records are excluded from retrieval; edits replace indexed content.
- Providers separate memory access from host adapters and UI. Governance reports
  record desired state, with JSON manifests and verification receipts.
- The heatmap is an illustrative local surface, **not measured model attention or
  causal attribution**. Model-generated explanations are interpretations, not proof.

## Privacy and Recovery

Credential filtering is best-effort, not a complete secret or personal-data detector.
It covers recognized token formats, labeled credentials, private keys and selected
server-secret values. Errors retain their original language after filtering.

**Raw memories, source records, exports and backups remain original, unencrypted
local data.** Review before sharing. Deletion removes the active record, not every
historical backup; it is not secure erasure. Existing exposed keys must be rotated.

Imports merge by default without silently overwriting conflicts. JSON roundtrips
preserve source metadata, timestamps and governance state. Text is stored as supplied,
one nonempty line per memory, without inferring personal facts. Neither export format
is advertised as a native ChatGPT/Claude backup format.

See [migration and recovery](docs/MEMORY_MIGRATION.md) and [privacy boundaries](docs/PRIVACY.md).

## Verification

```bash
npm run typecheck
npm test
npm run test:package
npm run build
```

The migration/privacy update passed 72 unit tests, 4 package-policy checks, strict
TypeScript and a production build. Browser suites cover memory management,
localization and credential redaction using an isolated library and synthetic data.
No real-provider call is included in those checks. See `scripts/check-*-ui.mjs`
and the [verification instructions](docs/MEMORY_MIGRATION.md#verification).

## Integration and Research

The product contribution is a user-facing memory control surface; the engineering
contribution is shared persistence and provider/host boundaries. Research questions
include how users interpret retrieval, how governance affects future recall, and
how to verify that user decisions were applied.

Native host-memory write-back, semantic embedding providers, broader privacy
classification and measured pre/post governance evaluations remain future work.
See the [plugin setup reference](CODEX_PLUGIN_INSTALL.md),
[architecture](PENSIEVE_DASHBOARD_PLUGIN_DESIGN.md), and
[project showcase](docs/PENSIEVE_REPO_SHOWCASE.md).

## License

[MIT](LICENSE). Focused contributions to providers, governance, privacy and evaluation are welcome.
