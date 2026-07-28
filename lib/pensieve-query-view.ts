import { type ActivationResult, type ScoredMemory } from "./memory.ts";
import {
  deriveMemoryPrioritySignals,
  type MemoryPrioritySignals
} from "./pensieve-memory-presenter.ts";
import { type StructuredMemoryRecord } from "./plugin-types.ts";

export type QueryFlowStatus = "idle" | "draft" | "loading" | "error" | "resolved";

export type PensieveQueryView = {
  visibleMemories: ScoredMemory[];
  activatedMemories: ScoredMemory[];
  hiddenCount: number;
  topKeywords: MemoryPrioritySignals["topKeywords"];
  topThemes: MemoryPrioritySignals["topThemes"];
  bucketSummary: {
    active: number;
    pinned: number;
    softened: number;
    hidden: number;
  };
  hasStrongMatch: boolean;
  isQueryDirty: boolean;
  status: QueryFlowStatus;
};

function toStructuredMemory(memory: ScoredMemory): StructuredMemoryRecord {
  return {
    id: memory.id,
    content: memory.content,
    keywords: [...memory.keywords],
    status: memory.status === "forgotten" ? "hidden" : memory.status,
    pinned: memory.pinned,
    riskLevel: memory.risk_level,
    createdAt: memory.created_at,
    updatedAt: memory.last_activated,
    lastActivatedAt: memory.last_activated,
    activationCount: memory.activation_count,
    importance: memory.relevance_score,
    sourceEventIds: [],
    sourcePaths: [],
    storagePath: "query-session",
    metadata: {
      infoType: memory.info_type,
      originContext: memory.origin_context,
      originTrustLevel: memory.origin_tp
    }
  };
}

export function derivePensieveQueryView(input: {
  query: string;
  result: ActivationResult;
  isLoading: boolean;
  error: string | null;
}): PensieveQueryView {
  const visibleMemories = [...input.result.memories];
  const structuredMemories = visibleMemories.map(toStructuredMemory);
  const priority = deriveMemoryPrioritySignals({
    memories: structuredMemories,
    keywordLimit: 8,
    themeLimit: 4
  });
  const activatedMemories = visibleMemories.filter((memory) => memory.relevance_score >= 0.2).slice(0, 4);
  const isQueryDirty = input.query.trim() !== input.result.query.trim();

  let status: QueryFlowStatus = "idle";
  if (input.error) {
    status = "error";
  } else if (input.isLoading) {
    status = "loading";
  } else if (isQueryDirty) {
    status = "draft";
  } else if (input.result.query.trim()) {
    status = "resolved";
  }

  const hiddenCount = Math.max(priority.hiddenCount, input.result.hiddenMemoryIds.length);

  return {
    visibleMemories,
    activatedMemories,
    hiddenCount,
    topKeywords: priority.topKeywords,
    topThemes: priority.topThemes,
    bucketSummary: {
      ...priority.bucketSummary,
      hidden: hiddenCount
    },
    hasStrongMatch: priority.hasStrongMatch,
    isQueryDirty,
    status
  };
}
