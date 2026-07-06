# Pensieve Local Repository

The dashboard plugin preview stores its local memory repository in:

- `data/pensieve-memory-records.json`

The committed JSON file is intentionally seeded with safe, non-personal sample memory for public repository use.

The current preview uses the server route:

- `/api/dashboard-memory`

This file-backed store is the default persistence layer for the mock host dashboard until a real host-backed memory provider replaces it.
