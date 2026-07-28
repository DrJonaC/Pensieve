import type { PensieveQueryView } from "./pensieve-query-view.ts";
import type {
  DashboardDerivedView,
  DashboardKeyword,
  DashboardTheme
} from "./pensieve-dashboard-core.ts";

export type PriorityChipTone = "strong" | "medium" | "soft";

export type PriorityPortrait = {
  buckets: Array<{
    label: "Active" | "Pinned" | "Softened" | "Hidden";
    value: number;
  }>;
  keywords: Array<{
    keyword: string;
    weight: number;
    tone: PriorityChipTone;
  }>;
  themes: Array<{
    label: string;
    weight: number;
    memoryCount: number;
  }>;
};

function deriveChipTone(weight: number, strongestWeight: number): PriorityChipTone {
  const intensity = strongestWeight > 0 ? weight / strongestWeight : 0;

  if (intensity >= 0.8) {
    return "strong";
  }

  if (intensity >= 0.55) {
    return "medium";
  }

  return "soft";
}

function presentKeywords(
  keywords: readonly DashboardKeyword[]
): PriorityPortrait["keywords"] {
  const strongestWeight = keywords[0]?.weight ?? 1;

  return keywords.map((entry) => ({
    keyword: entry.keyword,
    weight: entry.weight,
    tone: deriveChipTone(entry.weight, strongestWeight)
  }));
}

function presentThemes(
  themes: ReadonlyArray<DashboardTheme | { label: string; weight: number; memoryIds: string[] }>
): PriorityPortrait["themes"] {
  return themes.map((theme) => ({
    label: theme.label,
    weight: theme.weight,
    memoryCount: "memory_ids" in theme ? theme.memory_ids.length : theme.memoryIds.length
  }));
}

export function presentQueryPriorityPortrait(view: PensieveQueryView): PriorityPortrait {
  return {
    buckets: [
      { label: "Active", value: view.bucketSummary.active },
      { label: "Pinned", value: view.bucketSummary.pinned },
      { label: "Softened", value: view.bucketSummary.softened },
      { label: "Hidden", value: view.bucketSummary.hidden }
    ],
    keywords: presentKeywords(view.topKeywords),
    themes: presentThemes(view.topThemes)
  };
}

export function presentDashboardPriorityPortrait(
  derived: DashboardDerivedView
): PriorityPortrait {
  return {
    buckets: [
      { label: "Active", value: derived.buckets.active.length },
      { label: "Pinned", value: derived.buckets.pinned.length },
      { label: "Softened", value: derived.buckets.softened.length },
      { label: "Hidden", value: derived.buckets.hidden.length }
    ],
    keywords: presentKeywords(derived.top_keywords),
    themes: presentThemes(derived.surfaced_themes)
  };
}
