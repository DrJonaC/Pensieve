# Pensieve Governance Bridge Update

- Date: July 17, 2026
- Plugin build: `0.1.0+codex.20260717175531`

## Overview

This update moves Pensieve beyond static memory inspection. User governance decisions can now be compiled into a reviewable report, applied through the provider boundary, and verified with an itemized receipt.

The result is the first complete local governance loop:

```text
Memory action
  -> state difference
  -> Markdown report + JSON manifest
  -> provider application
  -> verification receipt
```

## New: Governance Bridge

The dashboard now includes a compact Governance Bridge panel.

- Tracks changes produced by `pin`, `soften`, `hide`, and `restore`.
- Compares current memory state with the last exported state instead of replaying UI events.
- Generates a human-readable Markdown report for review and audit.
- Generates a deterministic JSON manifest for provider execution.
- Applies the report as desired state, making repeated execution safe.
- Returns a per-memory receipt and detects provider drift.

Generated runtime artifacts are stored under:

```text
data/pensieve-governance/
  reports/
  receipts/
```

These artifacts are intentionally ignored by Git because they may contain local governance state.

## Safety And Privacy

- `hide` remains reversible suppression and is not presented as physical deletion.
- High-sensitivity memories reuse Pensieve's protected display policy in exported reports.
- The JSON manifest identifies governed memories by stable `memory_id` and target state.
- Markdown is the review surface; the JSON manifest is the machine-readable source of truth.
- A provider must return a receipt before Pensieve marks a report as verified.

This update changes external memory state, not model weights. A real Codex, Claude Code, or other host integration still requires a host-specific adapter that consumes the same provider contract.

## Runtime Stability

Host event capture has also been hardened:

- The visible event counter refreshes every 500 captured events instead of on every event.
- Event buffering stops automatically at 1,024 events.
- Stable host callbacks prevent the panel-ready event feedback loop.
- Host-side behavior continues after telemetry capture reaches its limit.

This keeps the dashboard interactive while preserving enough telemetry for local integration testing.

## Architecture Changes

The optional `MemoryProvider` governance capabilities are:

```ts
getGovernanceStatus?()
generateGovernanceReport?()
applyGovernanceReport?(reportId)
```

Read-only and legacy providers remain compatible. Future host adapters can implement the same boundary without changing the dashboard core.

## Verification

- TypeScript strict type-check passes.
- 21 focused behavior tests pass.
- Tests cover reversible report generation, protected export, provider drift, idempotent application, persistence, dashboard derivation, and bounded host event capture.

## Next Step

Implement a real host adapter that translates the JSON governance manifest into the host's native memory mutation API and returns a verifiable receipt to Pensieve.
