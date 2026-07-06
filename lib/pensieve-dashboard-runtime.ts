import {
  createDashboardState,
  type DashboardAction,
  type DashboardState,
  type MemoryProvider
} from "./pensieve-dashboard-core.ts";

export async function loadDashboardState(provider: MemoryProvider): Promise<DashboardState> {
  const memories = await provider.getMemories();
  return createDashboardState(memories);
}

export async function applyDashboardAction(
  provider: MemoryProvider,
  action: DashboardAction
): Promise<DashboardState> {
  const result = await provider.applyAction(action);
  return createDashboardState(result.memories);
}
