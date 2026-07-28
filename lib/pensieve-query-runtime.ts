import {
  baseMemories,
  buildDormantActivationResult,
  simulateActivation,
  type ActivationResult,
  type MemoryModifierMap,
  type ScoredMemory
} from "./memory.ts";
import {
  partitionMemoriesForQuery,
  type LLMQueryResult,
  type PartitionedMemories,
  type PensieveMode,
  type QueryApiResponse
} from "./query.ts";

type PrepareQueryExecutionInput = {
  query: string;
  modifiers: MemoryModifierMap;
  mode: PensieveMode;
};

export type QueryExecutionPlan = {
  activation: ActivationResult;
  partitioned: PartitionedMemories | null;
  shouldRequestLive: boolean;
};

export function prepareQueryExecution({
  query,
  modifiers,
  mode
}: PrepareQueryExecutionInput): QueryExecutionPlan {
  const trimmedQuery = query.trim();
  const activation = trimmedQuery
    ? simulateActivation(query, baseMemories, modifiers)
    : buildDormantActivationResult(baseMemories, modifiers, query);

  if (!trimmedQuery) {
    return {
      activation,
      partitioned: null,
      shouldRequestLive: false
    };
  }

  return {
    activation,
    partitioned: partitionMemoriesForQuery(activation.memories),
    shouldRequestLive: mode === "live"
  };
}

function isMemoryExplanationArray(value: unknown): value is LLMQueryResult["memory_explanations"] {
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      const candidate = entry as { memory_id?: unknown; why?: unknown };
      return typeof candidate.memory_id === "string" && typeof candidate.why === "string";
    })
  );
}

function isLLMQueryResult(value: unknown): value is LLMQueryResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as LLMQueryResult;
  return (
    typeof candidate.answer === "string" &&
    typeof candidate.summary === "string" &&
    isMemoryExplanationArray(candidate.memory_explanations)
  );
}

export async function requestLiveNarrative(
  query: string,
  partitioned: PartitionedMemories
): Promise<LLMQueryResult & { provider: string; model: string }> {
  const response = await fetch("/api/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mode: "live",
      query,
      memories: partitioned.llmMemories,
      cdv_memories: partitioned.cdvMemories
    })
  });

  const payload = (await response.json()) as QueryApiResponse;
  if (!response.ok || !payload.ok || !payload.data || !payload.meta || !isLLMQueryResult(payload.data)) {
    throw new Error(payload.error ?? "Live LLM mode failed.");
  }

  return {
    ...payload.data,
    provider: payload.meta.provider,
    model: payload.meta.model
  };
}

export function attachCdvResults(
  memories: readonly ScoredMemory[],
  cdvResults?: LLMQueryResult["cdv_results"]
): ScoredMemory[] {
  if (!cdvResults) {
    return [...memories];
  }

  return memories.map((memory) => ({
    ...memory,
    cdv: cdvResults[memory.id] ?? memory.cdv ?? null
  }));
}
