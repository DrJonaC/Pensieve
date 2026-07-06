# Pensieve Dashboard Plugin Design Notes

## Purpose

This document records the design decisions for the Pensieve dashboard plugin direction so the project stays readable, reusable, and easy to evolve.

It is intended to be updated as the plugin architecture and UI decisions change.

---

## 1. Product Direction

Pensieve will be extended into a **dashboard-style plugin** focused on showing a user's structured LLM memory.

The plugin is not intended to replace the main chat product. Its role is to act as a:

- memory observability layer
- memory interpretation layer
- lightweight memory governance layer

The plugin should help users answer:

- What does the system currently remember about me?
- Which memories are most important?
- Which memories are sensitive?
- How can I lightly adjust what the system keeps prominent?

---

## 2. Plugin Form Factor

The chosen form factor is:

**independent sidebar plugin**

Rationale:

- best matches the plugin mental model
- works well as a memory dashboard
- does not require owning the full chat surface
- is easier to adapt to Codex, Claude Code, and other local developer hosts later

The current product shape is now explicitly:

**single-surface plugin application**

This means `/dashboard` is the only intended product route and the old multi-page website framing has been retired.

---

## 3. Host Strategy

The plugin should be **host-agnostic first**.

This means the initial implementation should not be tightly coupled to:

- Codex
- Claude Code
- any specific assistant shell

Instead, the system should be split into:

- dashboard core
- provider interface
- host adapter

This keeps the internal plugin logic clean and makes future integration easier.

---

## 4. Scope of v1

The first plugin version is defined as:

**Query-free, lightweight, actionable dashboard**

v1 should support:

- viewing structured memory
- seeing priority signals
- seeing surfaced themes
- lightly managing memory state

v1 should support these actions:

- `pin`
- `soften`
- `hide`
- `restore`

v1 will **not** prioritize:

- query panel
- heatmap
- full query-based activation workflows
- advanced policy controls
- multi-provider switching UI

Rationale:

The team explicitly chose to make Query-free memory inspection the first plugin experience. Query-based observability can be added later on top of the same architecture.

---

## 5. Dashboard Core Responsibilities

The dashboard core should only handle:

- reading structured memory from a provider
- deriving display-ready dashboard state
- issuing lightweight memory actions

The dashboard core should **not** directly manage:

- host-specific integration
- database implementation details
- retrieval infrastructure details

Core positioning:

**host-agnostic memory dashboard rendering and interaction layer**

---

## 6. Provider Interface Philosophy

The `MemoryProvider` is the main boundary between the dashboard and any underlying memory system.

The dashboard should not care whether memory comes from:

- local structured storage
- a future vector-backed service
- Codex-local data
- Claude Code-local data

The provider protocol should be small and stable.

### Current v1 provider capabilities

- `getSnapshot()`
- `getMemories()`
- `applyAction(action)`

### Optional future capability

- `getActivationForQuery?(query)`

Rationale:

The first dashboard version is a memory-state dashboard, not a full query engine.

---

## 7. Dashboard State Model

The dashboard core maintains five conceptual layers of state:

### 1. Snapshot

Used for top-level overview:

- total memories
- active count
- pinned count
- softened count
- hidden count
- high-risk count

### 2. Memories

The current structured memory list.

### 3. Derived View

Computed locally from the current memory state:

- top keywords
- surfaced themes
- visible memories
- hidden memories
- grouped buckets

### 4. UI State

Pure interface state such as:

- expanded/collapsed mode
- loading
- error
- selected item
- pending action

### 5. Action State

Feedback around operations:

- action pending
- action result
- optimistic update behavior if needed later

Key principle:

**Provider owns source-of-truth memory state. Core owns projection/display state.**

---

## 8. Sidebar Layout Decision

The sidebar must be **resizable / expandable**.

Rationale:

- fits the plugin mental model
- supports quick inspection in compact mode
- supports deeper inspection in expanded mode

### Collapsed mode must prioritize

- `Snapshot`
- `Top Keywords`
- `Memory List`

### Expanded mode adds first-priority detail

- `Surfaced Themes`

This means the expanded layout becomes:

- Snapshot
- Top Keywords
- Surfaced Themes
- Memory List

---

## 9. UI Style Direction

The chosen design language is:

- clean
- minimal
- readable
- calm

Primary palette direction:

- Morandi green
- Morandi cyan

Stylistic rules:

- low saturation
- soft contrast
- very restrained shadows
- light, clean surfaces
- gentle rounded corners
- no heavy fantasy styling
- no noisy “developer tool” chrome

This plugin should feel like a **quiet memory control panel**.

---

## 10. v1 UI Building Blocks

The planned shell is composed of these reusable pieces:

- `DashboardShell`
- `SnapshotCard`
- `KeywordThemePanel`
- `MemoryListPanel`
- optional `MemoryActionBar`

Relationships:

- `DashboardShell`
  - `SnapshotCard`
  - `KeywordThemePanel`
  - `MemoryListPanel`
    - `MemoryActionBar`

The current implementation plan keeps the component count intentionally small.

---

## 11. State and Interaction Flow

### Initialization flow

On load:

1. call `provider.getSnapshot()`
2. call `provider.getMemories()`
3. derive dashboard view from the returned memories

### Render flow

The dashboard renders:

- raw provider data
- locally derived view state

### Action flow

When a user triggers an action:

1. UI calls `provider.applyAction(...)`
2. provider returns updated memory state
3. core rebuilds derived dashboard state
4. UI rerenders

Key principle:

**Provider mutates memory state, core rebuilds view state, shell renders user feedback.**

---

## 12. File Structure Direction

### Existing core/provider files

- `lib/pensieve-dashboard-core.ts`
- `lib/pensieve-local-provider.ts`

### Planned dashboard shell files

- `components/dashboard/DashboardShell.tsx`
- `components/dashboard/SnapshotCard.tsx`
- `components/dashboard/KeywordThemePanel.tsx`
- `components/dashboard/MemoryListPanel.tsx`
- optional `components/dashboard/MemoryActionBar.tsx`

### Planned preview entry

- `app/dashboard/page.tsx`

This route is a development preview surface, not the final host adapter.

---

## 13. Strategic Sequencing

The chosen build order is:

1. define dashboard core
2. define provider interface
3. implement local provider
4. implement dashboard shell
5. create development preview route
6. later adapt to host-specific plugin shells

This sequence is intentional:

It preserves a clean plugin core and avoids coupling early to any single host platform.

---

## 14. Current Status

Already completed:

- query-based memory-RAG foundation
- persisted memory store abstraction
- host-agnostic dashboard core
- local provider implementation
- focused tests for core and provider behavior
- plugin-only route strategy (`/dashboard` as the primary surface)

Next implementation target:

**continue refining the single-route dashboard shell and host-adapter path**

---

## 15. Short Summary

Pensieve dashboard plugin v1 is defined as:

**a host-agnostic, resizable, Query-free sidebar dashboard that displays structured LLM memory and supports lightweight memory governance through pin, soften, hide, and restore actions.**
