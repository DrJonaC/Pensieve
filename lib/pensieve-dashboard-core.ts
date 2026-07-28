import {
  type GovernanceBridgeStatus,
  type GovernanceReceipt,
  type GovernanceReportArtifact
} from "./pensieve-governance-bridge.ts";
import { deriveMemoryPrioritySignals } from "./pensieve-memory-presenter.ts";
import type { StructuredMemoryRecord } from "./plugin-types.ts";

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

function sortMemories(memories: readonly DashboardMemoryRecord[]): DashboardMemoryRecord[] {
  return [...memories].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.priority_score - left.priority_score;
  });
}

function toStructuredMemory(memory: DashboardMemoryRecord): StructuredMemoryRecord {
  return {
    id: memory.id,
    content: memory.content,
    keywords: [...memory.keywords],
    status: memory.status,
    pinned: memory.pinned,
    riskLevel: memory.risk_level,
    createdAt: memory.created_at,
    updatedAt: memory.updated_at ?? memory.last_activated ?? memory.created_at,
    lastActivatedAt: memory.last_activated,
    activationCount: memory.activation_count,
    importance: memory.priority_score,
    sourceEventIds: [],
    sourcePaths: [],
    storagePath: "dashboard-memory",
    metadata: {
      infoType: memory.info_type,
      originContext: memory.origin_context,
      originTrustLevel: memory.origin_tp
    }
  };
}

function toDashboardTheme(
  theme: DashboardDerivedView["surfaced_themes"][number],
  memoriesById: ReadonlyMap<string, DashboardMemoryRecord>
): DashboardTheme {
  const seedMemory = theme.memory_ids
    .map((memoryId) => memoriesById.get(memoryId))
    .find(Boolean);
  const prefix = seedMemory?.info_type ? `${seedMemory.info_type}: ` : "";

  return {
    ...theme,
    label: prefix && !theme.label.includes(":") ? `${prefix}${theme.label}` : theme.label
  };
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
  const memoriesById = new Map(sorted.map((memory) => [memory.id, memory]));
  const priority = deriveMemoryPrioritySignals({
    memories: sorted.map(toStructuredMemory),
    keywordLimit: 8,
    themeLimit: 5
  });

  return {
    visible_memories,
    hidden_memories,
    top_keywords: priority.topKeywords,
    surfaced_themes: priority.topThemes
      .map((theme) => ({
        label: theme.label,
        weight: theme.weight,
        memory_ids: theme.memoryIds
      }))
      .map((theme) => toDashboardTheme(theme, memoriesById)),
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
