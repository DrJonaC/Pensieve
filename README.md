<div align="center">

# Pensieve: Know How AI Remembers You

### See what AI remembers about you. Understand why. Decide what remains.

A local-first, host-agnostic dashboard that makes structured AI memory visible, understandable, and governable.

[English](./README.md) · [简体中文](./README.zh-CN.md) · [Installation](./CODEX_PLUGIN_INSTALL.md) · [Architecture](./PENSIEVE_DASHBOARD_PLUGIN_DESIGN.md)

![MIT License](https://img.shields.io/badge/license-MIT-718b84?style=flat-square)
![Next.js 15](https://img.shields.io/badge/Next.js-15.3-263d38?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript Strict](https://img.shields.io/badge/TypeScript-strict-789fa3?style=flat-square&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/status-research%20preview-a8bab4?style=flat-square)

![Pensieve: a magical memory basin revealing how AI remembers you](./docs/assets/pensieve-hero.png)

</div>

## Overview

AI does more than answer you. Across repeated interactions, it can build a working memory of your preferences, projects, habits, and sensitive context. Those memories may shape future responses, yet users rarely see how they are formed, why they surface, or what should remain.

**Pensieve lets you know how AI remembers you.** It turns hidden memory state into a user-facing control surface: reading structured memories through a provider, showing what remains prominent, protecting sensitive details, and enabling reversible governance actions. Its Governance Bridge then compiles those decisions into a reviewable Markdown report, a deterministic JSON manifest, and a verifiable provider receipt.

Pensieve does not modify model weights. It governs the external memory records and retrieval state that shape future model context.

## Product At A Glance

| Layer | What Pensieve exposes |
| --- | --- |
| **Snapshot** | Total, active, pinned, softened, hidden, and high-risk memory counts |
| **Priority** | Weighted keywords and surfaced themes derived from visible memory |
| **Memory units** | Structured fragments with provenance, risk, recency, activation, and status |
| **Governance** | Reversible `pin`, `soften`, `hide`, and `restore` controls |
| **Write-back** | Markdown report, JSON manifest, desired-state application, and receipt verification |
| **Protection** | Full, soft-mask, and protected display tiers for sensitive memory |

## The Governance Loop

Most memory tools stop at storage or retrieval. Pensieve focuses on the missing loop between **observation** and **user agency**.

![Pensieve governance loop](./docs/assets/governance-loop.svg)

1. Pensieve reads the current structured memory field.
2. The user inspects priority, risk, and provenance.
3. The user applies reversible governance decisions.
4. Pensieve compiles the resulting state into Markdown and JSON.
5. A provider applies that desired state to its memory store.
6. Pensieve verifies the result through an itemized receipt.

Reports are based on state differences, not UI event replay. Repeated application converges to the same target state instead of duplicating mutations.

## Architecture

Pensieve is deliberately split into a small host-independent kernel and replaceable integration boundaries.

![Pensieve host-agnostic architecture](./docs/assets/architecture.svg)

- **Dashboard core** derives snapshot metrics, ranking, keywords, themes, and display state.
- **MemoryProvider** owns source-of-truth memory reads and mutations.
- **Governance Bridge** translates user decisions into portable reports and receipts.
- **Host adapter** connects sidebar lifecycle and runtime events without leaking host assumptions into the core.
- **Local repository** provides a file-backed reference implementation for development and verification.

The provider contract remains intentionally small:

```ts
interface MemoryProvider {
  getSnapshot(): Promise<DashboardSnapshot>
  getMemories(): Promise<DashboardMemoryRecord[]>
  applyAction(action: DashboardAction): Promise<DashboardActionResult>

  getGovernanceStatus?(): Promise<GovernanceBridgeStatus>
  generateGovernanceReport?(): Promise<GovernanceReportArtifact>
  applyGovernanceReport?(reportId: string): Promise<GovernanceReceipt>
}
```

Read-only providers can implement only the first two methods. A real Codex, Claude Code, or other memory integration can add mutation and governance capabilities without changing the dashboard.

## Structured Memory Model

Pensieve treats memory as a semantic record, not a runtime event.

```ts
type MemoryUnit = {
  id: string
  content: string
  keywords: string[]
  priority_score: number
  risk_level: "low" | "medium" | "high"
  status: "active" | "softened" | "hidden"
  pinned: boolean
  created_at: string
  last_activated: string
  activation_count: number
}
```

Runtime events describe interaction with memory. Memory units are the stored semantic objects being observed and governed.

## Quick Start

### Run the local dashboard

```bash
git clone https://github.com/DrJonaC/Pensieve.git
cd Pensieve
npm install
npm run dev
```

Open `http://localhost:3000/dashboard`.

The local preview uses:

- `data/pensieve-memory-records.json` as its structured memory repository
- `/api/dashboard-memory` for memory reads and reversible actions
- `/api/governance-report` for report generation, provider application, and receipts

Generated governance artifacts are local and Git-ignored:

```text
data/pensieve-governance/
  reports/
  receipts/
```

### Install as a Codex plugin

```bash
codex plugin add pensieve-dashboard-plugin@personal
```

The local marketplace and Windows setup are documented in [CODEX_PLUGIN_INSTALL.md](./CODEX_PLUGIN_INSTALL.md). Start a new Codex task after reinstalling so the updated plugin metadata is loaded.

## Safety Model

Memory governance needs stronger semantics than a generic delete button.

- `soften` lowers prominence while preserving the record.
- `hide` suppresses active retrieval and remains reversible.
- `restore` returns hidden memory to the active field.
- High-sensitivity records use protected representations in both the UI and exported reports.
- The JSON manifest is the machine-readable source of truth; Markdown is the human review surface.
- Pensieve requires a receipt before it labels a report as verified.

Physical deletion is intentionally not claimed yet. A production hard-delete flow needs provider support, confirmation policy, retention semantics, and auditable proof of deletion.

## Why This Project Matters

Pensieve treats LLM memory as three connected research problems:

1. **Retrieval** — which stored memories influence future context?
2. **Observability** — can users understand what the system currently holds prominent?
3. **Governance** — can user decisions reliably change future memory behavior?

This makes Pensieve different from a conventional RAG inspector, a static analytics dashboard, or a chat UI. The product contribution is the observable and governable memory surface; the systems contribution is the provider and host boundary; the research contribution is the auditable feedback loop from user intent to memory-state verification.

## Current Scope

Pensieve currently ships as a **local Codex-compatible plugin source and reference implementation**.

Implemented:

- [x] Structured memory records and local persistence
- [x] Query-free memory dashboard
- [x] Priority keywords and surfaced themes
- [x] Governance-aware sensitive display
- [x] Reversible memory actions
- [x] Governance reports, manifests, and receipts
- [x] Host-agnostic provider and adapter contracts
- [x] Bounded host-event capture for stable local previews

Next:

- [ ] Native Codex memory write-back adapter
- [ ] Claude Code memory provider
- [ ] Provider capability discovery and permission UX
- [ ] Policy-backed correction, expiration, and hard deletion
- [ ] Pre/post governance retrieval evaluation
- [ ] Additional memory-store adapters

## Documentation

| Document | Purpose |
| --- | --- |
| [Plugin design](./PENSIEVE_DASHBOARD_PLUGIN_DESIGN.md) | Product boundaries, provider philosophy, and interaction decisions |
| [Visual style](./PENSIEVE_DASHBOARD_VISUAL_STYLE.md) | Reusable Morandi green-cyan dashboard language |
| [Codex installation](./CODEX_PLUGIN_INSTALL.md) | Local marketplace and plugin setup |
| [Governance Bridge update](./docs/updates/2026-07-17-governance-bridge.md) | Report, manifest, receipt, and telemetry release notes |
| [Project review](./PENSIEVE_PROJECT_REVIEW.md) | Motivation, innovation, and research framing |
| [Repository showcase](./docs/PENSIEVE_REPO_SHOWCASE.md) | GitHub and portfolio positioning |

## Contributing

Pensieve is early and intentionally modular. Issues and focused pull requests are welcome, especially around memory-provider adapters, governance semantics, evaluation, privacy, and host integration.

Please keep new integrations behind provider or host-adapter boundaries rather than coupling them directly into the dashboard core.

## License

Released under the [MIT License](./LICENSE).

---

<div align="center">

**Know how AI remembers you. Decide what it should remember next.**

</div>
