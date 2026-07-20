# Pensieve Codex Plugin Install Guide

This repository can now install the Pensieve plugin through a repo-local Codex
marketplace.

## Install Flow

1. Package the plugin source with `npm run package:plugin`.
2. Register the repo-local marketplace with Codex.
3. Install `pensieve-dashboard-plugin@pensieve-local`.
4. Start a new Codex thread before testing.

## Packaging A Release Folder

Run:

```bash
npm run package:plugin
```

This refreshes both of these paths:

```text
dist/pensieve-dashboard-plugin
codex-marketplace/plugins/pensieve-dashboard-plugin
```

The packaged output includes a generated:

```text
PLUGIN_PACKAGE_MANIFEST.json
```

which records the packaged paths and build timestamp.

## Repo-Local Marketplace

The local marketplace definition lives at:

```text
codex-marketplace/marketplace.json
```

Register it with Codex:

```bash
codex plugin marketplace add "D:\[]CJNCore\[02]Work\[02]Project\[03] Pensieve\codex-marketplace"
```

This exposes the marketplace name:

```text
pensieve-local
```

## Install Command

```bash
codex plugin add pensieve-dashboard-plugin@pensieve-local
```

## Local Persistence

The current preview persists dashboard memory state in:

`data/pensieve-memory-records.json`

The dashboard updates this repository through:

`/api/dashboard-memory`

## Updating During Development

When you update the local plugin source:

1. keep the same repository path
2. update the plugin manifest version or Codex cachebuster if needed
3. re-run `npm run package:plugin`
4. start a new Codex thread before testing again
