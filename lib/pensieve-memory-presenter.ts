import {
  deriveKeywordPriority,
  deriveThemes
} from "./plugin-derive.ts";
import type {
  MemoryTheme,
  StructuredMemoryRecord,
  WeightedKeyword
} from "./plugin-types.ts";

export type MemoryPrioritySignals = {
  topKeywords: WeightedKeyword[];
  topThemes: MemoryTheme[];
  bucketSummary: {
    active: number;
    pinned: number;
    softened: number;
    hidden: number;
  };
  hiddenCount: number;
  hasStrongMatch: boolean;
};

type DeriveMemoryPrioritySignalsInput = {
  memories: readonly StructuredMemoryRecord[];
  keywordLimit?: number;
  themeLimit?: number;
  strongMatchThreshold?: number;
};

export function deriveMemoryPrioritySignals({
  memories,
  keywordLimit = 8,
  themeLimit = 4,
  strongMatchThreshold = 0.34
}: DeriveMemoryPrioritySignalsInput): MemoryPrioritySignals {
  const visibleMemories = memories.filter((memory) => memory.status !== "hidden");
  const hiddenCount = memories.length - visibleMemories.length;
  const strongestScore = visibleMemories[0]?.importance ?? 0;

  return {
    topKeywords: deriveKeywordPriority(visibleMemories, keywordLimit),
    topThemes: deriveThemes(visibleMemories, themeLimit),
    bucketSummary: {
      active: visibleMemories.filter((memory) => memory.status === "active").length,
      pinned: visibleMemories.filter((memory) => memory.pinned).length,
      softened: visibleMemories.filter((memory) => memory.status === "softened").length,
      hidden: hiddenCount
    },
    hiddenCount,
    hasStrongMatch: strongestScore >= strongMatchThreshold
  };
}
