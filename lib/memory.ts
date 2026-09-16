import { detectCDV, type CDVMemoryUnit } from "./cdv.ts";
import {
  baseMemories as persistedBaseMemories,
  memoryRepository,
  type PersistedMemoryRecord
} from "./memory-store.ts";
import {
  createMemoryDatabase,
  retrieveMemories,
  type MemoryDatabase,
  type MemoryRetrievalInput
} from "./memory-rag.ts";

export type RiskLevel = "low" | "medium" | "high";
export type MemoryStatus = "active" | "softened" | "forgotten";

export type MemoryUnit = {
  id: string;
  content: string;
  keywords: string[];
  created_at: string;
  last_activated: string;
  activation_count: number;
  relevance_score: number;
  risk_level: RiskLevel;
  status: MemoryStatus;
  info_type?: "medical" | "financial" | "preference" | "behavioral" | "identity";
  origin_context?: string;
  origin_tp?: "public" | "consent-required" | "reciprocity" | "confidentiality";
};

export type MemoryModifier = {
  pinned: boolean;
  status: MemoryStatus;
};

export type MemoryModifierMap = Record<string, MemoryModifier>;

export type ScoredMemory = MemoryUnit & {
  pinned: boolean;
  cdv?: {
    is_violation: boolean;
    severity: "none" | "warning" | "critical";
    reason: string;
  } | null;
};

export type HeatmapCell = {
  token: string;
  memoryId: string;
  score: number;
};

export type ActivationResult = {
  query: string;
  response: string;
  tokens: string[];
  memories: ScoredMemory[];
  reasons: Record<string, string>;
  heatmap: HeatmapCell[];
  hiddenMemoryIds: string[];
};

const relativeNow = "2026-04-11T10:30:00.000Z";
const memoryDatabaseCache = new WeakMap<readonly MemoryUnit[], MemoryDatabase>();

function toMemoryUnit(memory: PersistedMemoryRecord): MemoryUnit {
  return {
    id: memory.id,
    content: memory.content,
    keywords: [...memory.keywords],
    created_at: memory.created_at,
    last_activated: memory.last_activated,
    activation_count: memory.activation_count,
    relevance_score: memory.base_importance,
    risk_level: memory.risk_level,
    status: memory.status,
    info_type: memory.info_type,
    origin_context: memory.origin_context,
    origin_tp: memory.origin_tp
  };
}

export const baseMemories: readonly MemoryUnit[] = Object.freeze(
  persistedBaseMemories.map(toMemoryUnit)
);

export function createDefaultMemoryModifiers(memories: readonly MemoryUnit[]): MemoryModifierMap {
  return memories.reduce<MemoryModifierMap>((accumulator, memory) => {
    accumulator[memory.id] = {
      pinned: false,
      status: memory.status
    };
    return accumulator;
  }, {});
}

export function tokenizeInput(input: string): string[] {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter(Boolean);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

function sortMemories(memories: ScoredMemory[]): ScoredMemory[] {
  return [...memories].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.relevance_score - left.relevance_score;
  });
}

function buildMockResponse(query: string, memories: ScoredMemory[]): string {
  const leadingMemories = memories
    .slice(0, 2)
    .map((memory) => memory.content.replace(/^The user /i, "").replace(/\.$/, ""))
    .join("; ");

  if (!query.trim()) {
    return "The memory field is quiet. Ask a question to see which traces become active.";
  }

  if (!leadingMemories) {
    return `Simulated reply: your prompt "${query}" did not surface any visible memories in the current session view.`;
  }

  return `Simulated reply: your prompt "${query}" primarily drew on memories suggesting you ${leadingMemories}.`;
}

function toRetrievalInput(memory: MemoryUnit): MemoryRetrievalInput {
  return {
    id: memory.id,
    content: memory.content,
    keywords: memory.keywords,
    created_at: memory.created_at,
    last_activated: memory.last_activated,
    activation_count: memory.activation_count,
    base_importance: memory.relevance_score,
    risk_level: memory.risk_level,
    status: memory.status
  };
}

function getMemoryDatabase(memories: readonly MemoryUnit[]): MemoryDatabase {
  if (memories === baseMemories) {
    return memoryRepository.getDatabase();
  }

  const cached = memoryDatabaseCache.get(memories);
  if (cached) {
    return cached;
  }

  const database = createMemoryDatabase(memories.map(toRetrievalInput));
  memoryDatabaseCache.set(memories, database);
  return database;
}

export function buildDormantActivationResult(
  memories: readonly MemoryUnit[],
  modifiers: MemoryModifierMap,
  query = ""
): ActivationResult {
  const visibleMemories: ScoredMemory[] = [];
  const reasons: Record<string, string> = {};
  const hiddenMemoryIds: string[] = [];

  memories.forEach((memory) => {
    const modifier = modifiers[memory.id];
    const status = modifier?.status ?? memory.status;

    if (status === "forgotten") {
      hiddenMemoryIds.push(memory.id);
      return;
    }

    reasons[memory.id] = "This memory is currently dormant and waiting for relevant context.";
    visibleMemories.push({
      ...memory,
      status,
      pinned: modifier?.pinned ?? false
    });
  });

  return {
    query,
    response: query.trim()
      ? "The memory field is quiet. Submit the current query to surface active traces."
      : "The memory field is quiet. Ask a question to see which traces become active.",
    tokens: [],
    memories: sortMemories(visibleMemories),
    reasons,
    heatmap: [],
    hiddenMemoryIds
  };
}

export function simulateActivation(
  query: string,
  memories: readonly MemoryUnit[],
  modifiers: MemoryModifierMap
): ActivationResult {
  const tokens = tokenizeInput(query);
  if (tokens.length === 0) {
    return buildDormantActivationResult(memories, modifiers, query);
  }

  const activatedAt = new Date().toISOString();
  const retrievalResult = retrieveMemories({
    query,
    database: getMemoryDatabase(memories),
    modifiers,
    topK: Math.min(5, memories.length)
  });
  const topKMemoryIds = new Set(retrievalResult.topK.map((memory) => memory.id));
  const memoryIndex = new Map(memories.map((memory) => [memory.id, memory]));

  const scoredMemories: ScoredMemory[] = retrievalResult.memories.map((retrievedMemory) => {
    const baseMemory = memoryIndex.get(retrievedMemory.id);
    if (!baseMemory) {
      throw new Error(`Missing base memory for retrieved memory ${retrievedMemory.id}.`);
    }

    const isActivated = topKMemoryIds.has(retrievedMemory.id);

    return {
      ...baseMemory,
      status: retrievedMemory.status,
      pinned: retrievedMemory.pinned,
      relevance_score: clampScore(retrievedMemory.relevance_score),
      last_activated: isActivated ? activatedAt : baseMemory.last_activated,
      activation_count: isActivated ? baseMemory.activation_count + 1 : baseMemory.activation_count
    };
  });

  const scoredWithCDV = scoredMemories.map((memory) => {
    const cdvMemory: CDVMemoryUnit = {
      ...memory,
      origin_context: memory.origin_context ?? "",
      origin_tp: (memory.origin_tp ?? "public") as CDVMemoryUnit["origin_tp"]
    };
    return { ...memory, cdv: detectCDV(query, cdvMemory) };
  });

  const sortedMemories = sortMemories(scoredWithCDV);

  return {
    query,
    response: buildMockResponse(query, sortedMemories),
    tokens,
    memories: sortedMemories,
    reasons: retrievalResult.reasons,
    heatmap: retrievalResult.heatmap,
    hiddenMemoryIds: retrievalResult.hiddenMemoryIds
  };
}

export function getRelativeTime(isoTime: string): string {
  const delta = new Date(relativeNow).getTime() - new Date(isoTime).getTime();
  const hours = Math.max(1, Math.round(delta / (1000 * 60 * 60)));

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
