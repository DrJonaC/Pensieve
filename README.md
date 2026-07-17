# Pensieve Dashboard Plugin

Pensieve is a plugin-ready dashboard for structured LLM memory observability and lightweight governance.

It is built around a simple product question:

**if an LLM can remember a user, can that memory become visible, interpretable, and gently governable?**

Pensieve turns that question into a practical local plugin surface. Instead of treating memory as a hidden implementation detail, it exposes a structured memory field that users can inspect, interpret, and adjust through reversible controls.

## Why Pensieve Exists

Most memory-enabled AI systems still behave like black boxes. A system may remember preferences, plans, sensitivities, or recurring themes, but the user rarely gets a clear answer to:

- what is currently being remembered
- what stays most prominent
- what should be softened, hidden, or kept visible

Pensieve is designed as a response to that gap. It treats memory not only as a retrieval problem, but also as an observability and governance problem.

## What The Current Plugin Does

The current release focuses on a compact dashboard experience for structured memory visibility:

- `Memory Snapshot`
  Shows the current shape of the memory field.
- `Priority Keywords`
  Surfaces which ideas are most prominent across visible memory.
- `Surfaced Themes`
  Compresses memory fragments into higher-level themes.
- `Memory List`
  Displays ranked memory fragments with status, risk, and provenance cues.
- `Reversible Actions`
  Supports `pin`, `soften`, `hide`, and `restore`.
- `Governance-Aware Display`
  Applies `Full`, `Soft mask`, and `Protected` display tiers based on memory sensitivity.
- `Governance Bridge`
  Compiles user decisions into Markdown and JSON reports, applies desired state through the provider boundary, and verifies the result with an itemized receipt.

## Why It Is Interesting

Pensieve is not just a styled memory viewer.

It sits at the intersection of three layers:

1. `Memory retrieval`
   Query-based memory-RAG remains the substrate for activating relevant memory.
2. `Memory visibility`
   The dashboard turns structured memory into an inspectable user-facing surface.
3. `Memory governance`
   Users can intervene through lightweight, reversible controls instead of destructive editing.

That combination makes Pensieve useful both as a product prototype and as a research artifact for explainable, governable long-term LLM memory.

## Architecture

Pensieve is intentionally split into clean boundaries:

- `dashboard core`
  Derives snapshot metrics, ranking, keywords, and surfaced themes from structured memory records.
- `memory provider`
  Supplies current memory state and applies reversible actions.
- `host adapter`
  Defines how the dashboard communicates with an external host shell without coupling to one runtime.
- `mock host`
  Simulates sidebar lifecycle, visibility, width, and event flow for local development.
- `local repository`
  Persists memory state in a local JSON file for preview and iteration.

This keeps the system modular: retrieval, storage, UI, and host integration can evolve independently without collapsing into a demo-only app.

## Current Release Shape

This repository currently ships as a:

**local Codex-compatible plugin source repository**

It includes:

- a host-agnostic dashboard core
- a mock host sidebar shell
- a local file-backed memory provider
- governance-aware memory display rules
- Codex-compatible plugin metadata

The active product surface is:

- `/dashboard`

## Local Persistence

The preview persists its local memory repository in:

- `data/pensieve-memory-records.json`

The dashboard reads and updates this repository through:

- `/api/dashboard-memory`

This means dashboard actions survive refreshes in the local development preview.

## OpenAI Integration

The repository also retains the earlier query-based explainability path.

For server-side OpenAI usage, place your API key in `.env.local`:

```env
OPENAI_API_KEY=your_api_key_here
```

The key is read only on the server and is never exposed to the browser.

## Local Development

Install dependencies and start the preview:

```bash
npm install
npm run dev
```

Then open the dashboard preview route in the local app.

## Installation In Codex

For local plugin installation and personal marketplace setup, see:

- [CODEX_PLUGIN_INSTALL.md](./CODEX_PLUGIN_INSTALL.md)

## Release Notes

For release framing and packaging guidance, see:

- [PENSIEVE_PLUGIN_RELEASE.md](./PENSIEVE_PLUGIN_RELEASE.md)
- [Governance Bridge Update](./docs/updates/2026-07-17-governance-bridge.md)

For prelaunch QA and manual validation, see:

- [PENSIEVE_PRELAUNCH_CHECKLIST.md](./PENSIEVE_PRELAUNCH_CHECKLIST.md)

## Showcase Notes

For GitHub-facing project positioning, resume bullets, and repo presentation copy, see:

- [docs/PENSIEVE_REPO_SHOWCASE.md](./docs/PENSIEVE_REPO_SHOWCASE.md)

## Design Docs

For reusable product and visual decisions, see:

- [PENSIEVE_DASHBOARD_PLUGIN_DESIGN.md](./PENSIEVE_DASHBOARD_PLUGIN_DESIGN.md)
- [PENSIEVE_DASHBOARD_VISUAL_STYLE.md](./PENSIEVE_DASHBOARD_VISUAL_STYLE.md)

## Project Framing

The most accurate one-line description today is:

**Pensieve is a local plugin-ready memory dashboard for observing, interpreting, and lightly governing structured LLM memory.**

That phrasing is intentionally precise: it reflects a real architectural direction and a real product boundary without overstating native host integration.

## License

MIT
