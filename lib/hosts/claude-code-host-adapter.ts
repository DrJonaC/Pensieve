import { getLocalMemoryProvider } from "../providers/local-memory-provider.ts";
import type { HostAdapter } from "./host-adapter.ts";

export function createClaudeCodeHostAdapter(): HostAdapter {
  return {
    kind: "claude-code",
    getContext() {
      return {
        kind: "claude-code",
        displayName: "Claude Code",
        description: "Prepared for Claude Code-style local plugin hosting with the same structured memory contract.",
        capabilities: {
          sidebar: true,
          localPathsVisible: true,
          providerInjection: true
        },
        launchHints: [
          "Embed in a side panel beside the working thread.",
          "Resolve memory traces from the local structured store before rendering details."
        ]
      };
    },
    getProvider() {
      return getLocalMemoryProvider();
    }
  };
}
