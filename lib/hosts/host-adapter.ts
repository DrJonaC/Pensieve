import type { HostContext, HostKind, MemoryProvider } from "../plugin-types.ts";

export type HostAdapter = {
  kind: HostKind;
  getContext(): HostContext;
  getProvider(): MemoryProvider;
};
