import { createClaudeCodeHostAdapter } from "./claude-code-host-adapter.ts";
import { createCodexHostAdapter } from "./codex-host-adapter.ts";
import { createGenericHostAdapter } from "./generic-host-adapter.ts";
import type { HostAdapter } from "./host-adapter.ts";

function normalizeHostHint(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function resolveHostAdapter(hostHint?: string | null): HostAdapter {
  const normalized = normalizeHostHint(hostHint);

  if (normalized === "codex") {
    return createCodexHostAdapter();
  }

  if (normalized === "claude" || normalized === "claude-code") {
    return createClaudeCodeHostAdapter();
  }

  return createGenericHostAdapter();
}
