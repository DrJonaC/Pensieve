import type { ActivationResult, ScoredMemory } from "./memory.ts";

export type PensieveMode = "mock" | "live";

export type QueryMemoryInput = {
  id: string;
  content: string;
  relevance_score: number;
  risk_level: ScoredMemory["risk_level"];
  keywords: string[];
  origin_context?: string;
  origin_tp?: string;
};

export type MemoryExplanation = {
  memory_id: string;
  why: string;
};

export type LLMQueryResult = {
  answer: string;
  summary: string;
  memory_explanations: MemoryExplanation[];
  cdv_results?: Record<string, {
    is_violation: boolean;
    severity: "none" | "warning" | "critical";
    reason: string;
  }>;
};

export type QueryApiRequest = {
  mode: PensieveMode;
  query: string;
  memories: QueryMemoryInput[];
  cdv_memories: QueryMemoryInput[];
};

export type QueryApiResponse = {
  ok: boolean;
  data?: LLMQueryResult;
  error?: string;
  meta?: {
    provider: string;
    model: string;
    mode: PensieveMode;
  };
};

export type NarrativeState = LLMQueryResult & {
  provider: string;
  model: string;
  source: PensieveMode;
};

export type PartitionedMemories = {
  llmMemories: QueryMemoryInput[];
  cdvMemories: QueryMemoryInput[];
};

function toQueryInput(memory: ScoredMemory): QueryMemoryInput {
  return {
    id: memory.id,
    content: memory.content,
    relevance_score: Number(memory.relevance_score.toFixed(3)),
    risk_level: memory.risk_level,
    keywords: memory.keywords,
    origin_context: memory.origin_context,
    origin_tp: memory.origin_tp
  };
}

export function partitionMemoriesForQuery(memories: readonly ScoredMemory[]): PartitionedMemories {
  return {
    llmMemories: memories.slice(0, 3).map(toQueryInput),
    cdvMemories: memories.map(toQueryInput)
  };
}

export function buildMockNarrative(result: ActivationResult): NarrativeState {
  const topMemories = result.memories.slice(0, 3);

  return {
    answer: result.response,
    summary: topMemories.length
      ? `Most activated traces: ${topMemories.map((memory) => memory.content).join(" ")}`
      : "No visible memories were activated by the current prompt.",
    memory_explanations: topMemories.map((memory) => ({
      memory_id: memory.id,
      why: result.reasons[memory.id] ?? "This memory remained available in the active field."
    })),
    provider: "local-simulation",
    model: "heuristic-memory-engine",
    source: "mock"
  };
}

export function mergeMemoryExplanationMap(
  fallbackReasons: Record<string, string>,
  explanations: MemoryExplanation[]
): Record<string, string> {
  const next = { ...fallbackReasons };

  explanations.forEach((explanation) => {
    next[explanation.memory_id] = explanation.why;
  });

  return next;
}
