# Pensieve Plugin-Only Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the mixed MIDAS/Pensieve app into a single-surface Pensieve dashboard plugin centered on `/dashboard`.

**Architecture:** Keep the new dashboard core, provider, and runtime layers as the system backbone. Remove or neutralize website-era routing, branding, and shell structure so the product reads as a local sidebar plugin instead of a multi-page web app.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS

---

## File Structure

### Keep and build on

- `lib/pensieve-dashboard-core.ts`
- `lib/pensieve-local-provider.ts`
- `lib/pensieve-dashboard-runtime.ts`
- `components/dashboard/*`
- `app/dashboard/page.tsx`

### Modify

- `app/layout.tsx`
- `components/AppShell.tsx`
- `app/page.tsx`
- `app/guide/page.tsx`
- `app/user-view/page.tsx`
- `app/surface-model/page.tsx`
- `components/NavTabs.tsx`
- `app/globals.css`
- `PENSIEVE_DASHBOARD_PLUGIN_DESIGN.md`

### Delete or stop using

- Website-style MIDAS branding and navigation behavior
- Dashboard preview framing copy that makes `/dashboard` feel like a route inside a larger site

---

## Task 1: Collapse the App Into a Plugin Container

**Files:**
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\app\layout.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\components\AppShell.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\app\page.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\app\guide\page.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\app\user-view\page.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\app\surface-model\page.tsx`

- [ ] Remove MIDAS metadata and replace it with Pensieve plugin metadata.
- [ ] Simplify `AppShell` into a light plugin container instead of a website header/navigation shell.
- [ ] Redirect `/`, `/guide`, `/user-view`, and `/surface-model` to `/dashboard`.

## Task 2: Remove Website-Era Navigation and Branding

**Files:**
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\components\NavTabs.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\PENSIEVE_DASHBOARD_PLUGIN_DESIGN.md`

- [ ] Remove visible multi-page tab behavior from the product shell.
- [ ] Update the design doc status so it explicitly reflects the plugin-only single-route product shape.

## Task 3: Redesign `/dashboard` as the Plugin’s Only Surface

**Files:**
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\app\dashboard\page.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\components\dashboard\DashboardShell.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\components\dashboard\SnapshotCard.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\components\dashboard\KeywordThemePanel.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\components\dashboard\MemoryListPanel.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\components\dashboard\MemoryActionBar.tsx`
- Modify: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\app\globals.css`

- [ ] Remove “preview page inside a larger product” framing.
- [ ] Rebuild the page around a single plugin panel with the approved information order:
  - Snapshot
  - Top Keywords
  - Surfaced Themes
  - Memory List
- [ ] Shift styling away from black/gold MIDAS cues into low-saturation Morandi green/cyan panel design.
- [ ] Keep expand/collapse behavior and light governance actions.

## Task 4: Verify Plugin Core Still Holds

**Files:**
- Test: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\lib\pensieve-dashboard-core.test.ts`
- Test: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\lib\pensieve-local-provider.test.ts`
- Test: `D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\lib\pensieve-dashboard-runtime.test.ts`

- [ ] Run the focused dashboard tests.
- [ ] Run `tsc --noEmit`.
- [ ] Summarize any remaining legacy cleanup not required for the plugin-only product.
