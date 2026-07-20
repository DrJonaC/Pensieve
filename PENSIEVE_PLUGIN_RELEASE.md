# Pensieve Plugin Release Notes

## Current Release Shape

Pensieve is currently packaged as a:

**local Codex-compatible plugin source repository**

This repository includes:

- `.codex-plugin/plugin.json`
- the Next.js dashboard preview surface
- the host adapter protocol
- the mock host shell
- the local file-backed memory provider
- governance-aware dashboard rendering

## What This Release Supports

This release is suitable for:

- local Codex plugin development
- GitHub distribution as a plugin source repository
- GitHub distribution as a packaged local plugin folder via `dist/pensieve-dashboard-plugin`
- local installation through the repo-local Codex marketplace at `codex-marketplace/marketplace.json`
- mock-host validation of the Pensieve sidebar experience

## What This Release Does Not Yet Include

This release does not yet include:

- a Codex-native production sidebar host binding
- a Claude Code-specific host adapter
- binary release asset bundling beyond the local packaging script
- host-authenticated remote memory storage

## Required Runtime Assumptions

The current release assumes:

- Node and project dependencies are installed locally
- the dashboard preview runs from this repository
- local memory persistence is stored in `data/pensieve-memory-records.json`

## Release Checklist

Before publishing this repository as a plugin source:

1. confirm `.codex-plugin/plugin.json` is current
2. confirm `data/pensieve-memory-records.json` contains safe seed data only
3. confirm install instructions in `CODEX_PLUGIN_INSTALL.md` still match the repo layout
4. run `npm run package:plugin`
5. run type-checking and focused local tests
6. publish the repository or tag the GitHub release

## Recommended Publish Story

The cleanest current public framing is:

**Pensieve Dashboard is a local plugin-ready source repository for structured LLM memory observability and lightweight governance.**

That phrasing is accurate for the current maturity level and avoids overstating host integration before the first real host adapter lands.
