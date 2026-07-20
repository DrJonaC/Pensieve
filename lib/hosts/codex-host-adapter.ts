import { getLocalMemoryProvider } from "../providers/local-memory-provider.ts";
import type { HostAdapter } from "./host-adapter.ts";

export function createCodexHostAdapter(): HostAdapter {
  return {
    kind: "codex",
    getContext() {
      return {
        kind: "codex",
        displayName: "Codex",
        description: "Optimized for local Codex sidebar embedding with provider injection and path review.",
        capabilities: {
          sidebar: true,
          localPathsVisible: true,
          providerInjection: true
        },
        launchHints: [
          "Mount this panel in a right-side plugin surface.",
          "Inject the local structured memory provider at session start."
        ]
      };
    },
    getProvider() {
      return getLocalMemoryProvider();
    }
  };
}
