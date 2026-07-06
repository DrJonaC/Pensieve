# Pensieve Codex Plugin Install Guide

This repository can be installed as a local Codex plugin source.

## Install Flow

1. Place the repository in your local plugins directory.
2. Add a marketplace entry that points to `./plugins/pensieve-dashboard-plugin`.
3. Install with `codex plugin add pensieve-dashboard-plugin@personal`.
4. Start a new Codex thread before testing.

## Recommended Plugin Source Path

Windows:

`%USERPROFILE%\plugins\pensieve-dashboard-plugin`

macOS or Linux:

`~/plugins/pensieve-dashboard-plugin`

The plugin source directory should contain:

- `.codex-plugin/plugin.json`
- `app/`
- `components/`
- `lib/`
- `data/`
- `package.json`

## Personal Marketplace Entry

Edit or create:

`%USERPROFILE%\.agents\plugins\marketplace.json`

Add this entry to the `plugins` array:

```json
{
  "name": "pensieve-dashboard-plugin",
  "source": {
    "source": "local",
    "path": "./plugins/pensieve-dashboard-plugin"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

If you are creating the marketplace file from scratch, use:

```json
{
  "name": "personal",
  "interface": {
    "displayName": "Personal"
  },
  "plugins": [
    {
      "name": "pensieve-dashboard-plugin",
      "source": {
        "source": "local",
        "path": "./plugins/pensieve-dashboard-plugin"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

## Install Command

```bash
codex plugin add pensieve-dashboard-plugin@personal
```

## Local Persistence

The current preview persists dashboard memory state in:

`data/pensieve-memory-records.json`

The dashboard updates this repository through:

`/api/dashboard-memory`

## Updating During Development

When you update the local plugin source:

1. keep the same plugin folder path
2. update the plugin manifest version or Codex cachebuster if needed
3. reinstall with:

```bash
codex plugin add pensieve-dashboard-plugin@personal
```

4. start a new Codex thread before testing again
