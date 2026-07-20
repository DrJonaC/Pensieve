import {
  type MemorySnapshot,
  type MemoryTheme,
  type StructuredMemoryRecord,
  type WeightedKeyword
} from "./plugin-types.ts";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "user",
  "about",
  "their",
  "them",
  "your",
  "what"
]);

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function memoryWeight(memory: StructuredMemoryRecord): number {
  const pinBoost = memory.pinned ? 0.12 : 0;
  const hiddenPenalty = memory.status === "hidden" ? 0.18 : 0;
  const softenedPenalty = memory.status === "softened" ? 0.08 : 0;
  return Math.max(0.05, memory.importance + pinBoost - hiddenPenalty - softenedPenalty);
}

function summarizeTheme(memory: StructuredMemoryRecord): string {
  const meaningfulKeywords = memory.keywords
    .map(normalizeToken)
    .filter((keyword) => keyword.length > 2 && !STOPWORDS.has(keyword))
    .slice(0, 2);

  if (meaningfulKeywords.length > 0) {
    return toTitleCase(meaningfulKeywords.join(" "));
  }

  const contentTokens = memory.content
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
    .slice(0, 3);

  return toTitleCase(contentTokens.join(" ")) || "Unclassified Memory";
}

export function deriveKeywordPriority(
  memories: readonly StructuredMemoryRecord[],
  limit = 8
): WeightedKeyword[] {
  const weights = new Map<string, number>();

  memories.forEach((memory) => {
    if (memory.status === "hidden") {
      return;
    }

    const weight = memoryWeight(memory);
    memory.keywords.forEach((keyword) => {
      const normalized = normalizeToken(keyword);
      if (!normalized || STOPWORDS.has(normalized)) {
        return;
      }

      weights.set(normalized, (weights.get(normalized) ?? 0) + weight);
    });
  });

  return [...weights.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([keyword, weight]) => ({
      keyword,
      weight: Number(weight.toFixed(3))
    }));
}

export function deriveThemes(
  memories: readonly StructuredMemoryRecord[],
  limit = 4
): MemoryTheme[] {
  const themeMap = new Map<string, MemoryTheme>();

  memories.forEach((memory) => {
    if (memory.status === "hidden") {
      return;
    }

    const label = summarizeTheme(memory);
    const existing = themeMap.get(label);
    const weight = Number(memoryWeight(memory).toFixed(3));

    if (existing) {
      existing.weight = Number((existing.weight + weight).toFixed(3));
      existing.memoryIds = [...new Set([...existing.memoryIds, memory.id])];
      return;
    }

    themeMap.set(label, {
      label,
      weight,
      memoryIds: [memory.id]
    });
  });

  return [...themeMap.values()]
    .sort((left, right) => right.weight - left.weight)
    .slice(0, limit);
}

export function deriveMemorySnapshot(memories: readonly StructuredMemoryRecord[]): MemorySnapshot {
  return {
    total: memories.length,
    active: memories.filter((memory) => memory.status === "active").length,
    softened: memories.filter((memory) => memory.status === "softened").length,
    hidden: memories.filter((memory) => memory.status === "hidden").length,
    pinned: memories.filter((memory) => memory.pinned).length,
    highRisk: memories.filter((memory) => memory.riskLevel === "high").length,
    topKeywords: deriveKeywordPriority(memories),
    topThemes: deriveThemes(memories)
  };
}
