import {
  type GovernanceBridgeStatus,
  type GovernanceReceipt,
  type GovernanceReportArtifact
} from "./pensieve-governance-bridge.ts";

export type DashboardRiskLevel = "low" | "medium" | "high";
export type DashboardMemoryStatus = "active" | "softened" | "hidden";
export type DashboardInfoType =
  | "medical"
  | "financial"
  | "preference"
  | "behavioral"
  | "identity";

export type DashboardMemoryRecord = {
  id: string;
  content: string;
  keywords: string[];
  priority_score: number;
  risk_level: DashboardRiskLevel;
  status: DashboardMemoryStatus;
  pinned: boolean;
  created_at: string;
  updated_at?: string;
  last_activated: string;
  activation_count: number;
  info_type?: DashboardInfoType;
  origin_context?: string;
  origin_tp?: "public" | "consent-required" | "reciprocity" | "confidentiality";
};

export type DashboardSnapshot = {
  total_count: number;
  active_count: number;
  pinned_count: number;
  softened_count: number;
  hidden_count: number;
  high_risk_count: number;
  last_updated_at: string;
};

export type DashboardKeyword = {
  keyword: string;
  weight: number;
};

export type DashboardTheme = {
  label: string;
  weight: number;
  memory_ids: string[];
};

export type DashboardBuckets = {
  active: DashboardMemoryRecord[];
  pinned: DashboardMemoryRecord[];
  softened: DashboardMemoryRecord[];
  hidden: DashboardMemoryRecord[];
};

export type DashboardDerivedView = {
  visible_memories: DashboardMemoryRecord[];
  hidden_memories: DashboardMemoryRecord[];
  top_keywords: DashboardKeyword[];
  surfaced_themes: DashboardTheme[];
  buckets: DashboardBuckets;
};

export type DashboardState = {
  snapshot: DashboardSnapshot;
  memories: DashboardMemoryRecord[];
  derived: DashboardDerivedView;
};

export type DashboardAction =
  | { type: "pin"; memory_id: string; value: boolean }
  | { type: "soften"; memory_id: string; value: boolean }
  | { type: "hide"; memory_id: string }
  | { type: "restore"; memory_id: string };

export type DashboardActionResult = {
  snapshot: DashboardSnapshot;
  memories: DashboardMemoryRecord[];
  changed_memory?: DashboardMemoryRecord;
};

export type DashboardActivationRecord = {
  query: string;
  activated_memories: DashboardMemoryRecord[];
  reasons: Record<string, string>;
};

export interface MemoryProvider {
  getSnapshot(): Promise<DashboardSnapshot> | DashboardSnapshot;
  getMemories(): Promise<DashboardMemoryRecord[]> | DashboardMemoryRecord[];
  applyAction(action: DashboardAction): Promise<DashboardActionResult> | DashboardActionResult;
  getActivationForQuery?(query: string): Promise<DashboardActivationRecord> | DashboardActivationRecord;
  getGovernanceStatus?(): Promise<GovernanceBridgeStatus>;
  generateGovernanceReport?(): Promise<GovernanceReportArtifact>;
  applyGovernanceReport?(reportId: string): Promise<GovernanceReceipt>;
}

function clampWeight(weight: number): number {
  return Math.max(0, Number(weight.toFixed(3)));
}

function sortMemories(memories: readonly DashboardMemoryRecord[]): DashboardMemoryRecord[] {
  return [...memories].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.priority_score - left.priority_score;
  });
}

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

function createKeywordWeights(memories: readonly DashboardMemoryRecord[]): DashboardKeyword[] {
  const weights = new Map<string, number>();

  memories.forEach((memory) => {
    const contribution = memory.priority_score + (memory.pinned ? 0.12 : 0);

    memory.keywords.forEach((keyword) => {
      const normalized = normalizeKeyword(keyword);
      weights.set(normalized, (weights.get(normalized) ?? 0) + contribution);
    });
  });

  return [...weights.entries()]
    .map(([keyword, weight]) => ({ keyword, weight: clampWeight(weight) }))
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 8);
}

function buildThemeLabel(memory: DashboardMemoryRecord): string {
  if (memory.info_type) {
    return `${memory.info_type}: ${memory.keywords.slice(0, 2).join(" ")}`;
  }

  return memory.keywords.slice(0, 2).join(" ");
}

function createThemes(memories: readonly DashboardMemoryRecord[]): DashboardTheme[] {
  const themeMap = new Map<string, DashboardTheme>();

  memories.slice(0, 5).forEach((memory) => {
    const label = buildThemeLabel(memory);
    const existing = themeMap.get(label);

    if (existing) {
      existing.weight = clampWeight(existing.weight + memory.priority_score);
      existing.memory_ids.push(memory.id);
      return;
    }

    themeMap.set(label, {
      label,
      weight: clampWeight(memory.priority_score),
      memory_ids: [memory.id]
    });
  });

  return [...themeMap.values()].sort((left, right) => right.weight - left.weight);
}

export function createSnapshot(memories: readonly DashboardMemoryRecord[]): DashboardSnapshot {
  const lastUpdated = memories
    .map((memory) => memory.updated_at ?? memory.last_activated ?? memory.created_at)
    .sort()
    .at(-1) ?? new Date().toISOString();

  return {
    total_count: memories.length,
    active_count: memories.filter((memory) => memory.status === "active").length,
    pinned_count: memories.filter((memory) => memory.pinned).length,
    softened_count: memories.filter((memory) => memory.status === "softened").length,
    hidden_count: memories.filter((memory) => memory.status === "hidden").length,
    high_risk_count: memories.filter((memory) => memory.risk_level === "high").length,
    last_updated_at: lastUpdated
  };
}

export function deriveDashboardView(memories: readonly DashboardMemoryRecord[]): DashboardDerivedView {
  const sorted = sortMemories(memories);
  const visible_memories = sorted.filter((memory) => memory.status !== "hidden");
  const hidden_memories = sorted.filter((memory) => memory.status === "hidden");

  return {
    visible_memories,
    hidden_memories,
    top_keywords: createKeywordWeights(visible_memories),
    surfaced_themes: createThemes(visible_memories),
    buckets: {
      active: visible_memories.filter((memory) => memory.status === "active"),
      pinned: visible_memories.filter((memory) => memory.pinned),
      softened: visible_memories.filter((memory) => memory.status === "softened"),
      hidden: hidden_memories
    }
  };
}

export function createDashboardState(memories: readonly DashboardMemoryRecord[]): DashboardState {
  const sorted = sortMemories(memories);

  return {
    snapshot: createSnapshot(sorted),
    memories: sorted,
    derived: deriveDashboardView(sorted)
  };
}
