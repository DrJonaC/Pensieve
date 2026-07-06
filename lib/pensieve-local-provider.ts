import { loadBaseMemories, type PersistedMemoryRecord } from "./memory-store.ts";
import {
  createDashboardState,
  type DashboardAction,
  type DashboardActionResult,
  type DashboardMemoryRecord,
  type DashboardSnapshot,
  type MemoryProvider
} from "./pensieve-dashboard-core.ts";
import {
  applyDashboardActionToRecords,
  toDashboardMemory
} from "./pensieve-records.ts";

type LocalProviderOptions = {
  initialRecords?: readonly PersistedMemoryRecord[];
};

type LocalProviderState = Map<string, DashboardMemoryRecord>;

function readSortedMemories(state: LocalProviderState): DashboardMemoryRecord[] {
  return createDashboardState([...state.values()]).memories;
}

export function createLocalMemoryProvider(
  options: LocalProviderOptions = {}
): MemoryProvider {
  let persistedRecords = (options.initialRecords ?? loadBaseMemories()).map((memory) => ({
    ...memory,
    keywords: [...memory.keywords]
  }));
  let state = new Map(persistedRecords.map((memory) => [memory.id, toDashboardMemory(memory)]));

  const getCurrentState = () => createDashboardState(readSortedMemories(state));

  const getMemory = (memoryId: string): DashboardMemoryRecord => {
    const memory = state.get(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} was not found.`);
    }

    return memory;
  };

  return {
    getSnapshot(): DashboardSnapshot {
      return getCurrentState().snapshot;
    },

    getMemories(): DashboardMemoryRecord[] {
      return getCurrentState().memories;
    },

    applyAction(action: DashboardAction): DashboardActionResult {
      const next = applyDashboardActionToRecords(persistedRecords, action);
      persistedRecords = next.records;
      state = new Map(next.records.map((memory) => [memory.id, toDashboardMemory(memory)]));

      return {
        ...next.result,
        changed_memory: getMemory(action.memory_id)
      };
    }
  };
}
