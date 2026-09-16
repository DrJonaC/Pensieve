import type { PersistedMemoryRecord } from "./memory-store.ts";
import { simulateActivation, buildDormantActivationResult, type MemoryUnit } from "./memory.ts";

export function activateRepository(query: string, records: readonly PersistedMemoryRecord[]) {
  // Fresh records produce a fresh local lexical index, never a stale bundled snapshot.
  const memories: MemoryUnit[] = records.map(memory => ({ ...memory, relevance_score: memory.base_importance }));
  const modifiers = Object.fromEntries(records.map(memory => [memory.id, { pinned: memory.pinned, status: memory.status }]));
  return query.trim() ? simulateActivation(query, memories, modifiers) : buildDormantActivationResult(memories, modifiers);
}
