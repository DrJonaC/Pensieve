import { getPersistedMemoryProvider } from "../providers/persisted-memory-provider.ts";
import type { HostAdapter } from "./host-adapter.ts";

export function createGenericHostAdapter(): HostAdapter {
  return {
    kind: "generic",
    getContext() {
      return {
        kind: "generic",
        displayName: "Generic Host",
        description: "A host-neutral dashboard shell for validating the plugin core outside a specific assistant surface.",
        capabilities: {
          sidebar: true,
          localPathsVisible: true,
          providerInjection: false
        },
        launchHints: [
          "Use this shell to validate plugin behavior before attaching a host adapter.",
          "Replace the local provider with a host-managed provider when embedding elsewhere."
        ]
      };
    },
    getProvider() {
      return getPersistedMemoryProvider();
    }
  };
}
