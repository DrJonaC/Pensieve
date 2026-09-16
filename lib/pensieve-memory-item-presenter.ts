import { type CDVResult } from "./cdv.ts";
import { redactSensitiveText } from "./privacy.ts";
import { getRelativeTime, type ScoredMemory } from "./memory.ts";
import { type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";
import {
  getGovernedMemoryDisplay,
  type GovernedMemoryDisplay
} from "./pensieve-governance.ts";
import type { StructuredMemoryRecord } from "./plugin-types.ts";

export type PresentedMemoryItem = {
  id: string;
  title: string;
  statusLabel: string;
  riskLabel: string;
  riskLevel: "low" | "medium" | "high";
  pinned: boolean;
  keywords: string[];
  scorePercent: number;
  progressPercent: number;
  lastActivatedLabel?: string;
  activationCount?: number;
  infoTypeLabel?: string;
  sourceLabel?: string;
  governanceTierLabel?: string;
  storageLabel?: string;
  explanation?: string;
  priorityLabel?: string;
  cdvLabel?: string;
  cdvReason?: string;
};

function clampProgress(value: number): number {
  return Math.max(Math.round(value * 100), 6);
}

function compactDate(isoTime?: string): string | undefined {
  if (!isoTime) {
    return undefined;
  }

  return new Date(isoTime).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function startCase(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function toCDVLabel(cdv?: CDVResult): string | undefined {
  if (!cdv) {
    return undefined;
  }

  if (!cdv.is_violation) {
    return "CDV Clean";
  }

  return cdv.severity === "critical" ? "CDV Violation" : "Context Drift";
}

export function presentQueryMemoryItem(input: {
  memory: ScoredMemory;
  explanation?: string;
  priorityIndex?: number;
  cdv?: CDVResult;
}): PresentedMemoryItem {
  const { memory, explanation, priorityIndex, cdv } = input;

  return {
    id: memory.id,
    title: memory.content,
    statusLabel: memory.status,
    riskLabel: `${memory.risk_level} risk`,
    riskLevel: memory.risk_level,
    pinned: memory.pinned,
    keywords: memory.keywords,
    scorePercent: Math.round(memory.relevance_score * 100),
    progressPercent: clampProgress(memory.relevance_score),
    lastActivatedLabel: getRelativeTime(memory.last_activated),
    activationCount: memory.activation_count,
    infoTypeLabel: startCase(memory.info_type),
    sourceLabel: startCase(memory.origin_tp),
    explanation: explanation === undefined ? undefined : redactSensitiveText(explanation),
    priorityLabel: priorityIndex ? `Priority ${priorityIndex}` : undefined,
    cdvLabel: toCDVLabel(cdv),
    cdvReason: cdv?.is_violation ? redactSensitiveText(cdv.reason) : undefined
  };
}

export function presentDashboardMemoryItem(
  memory: DashboardMemoryRecord,
  governed: GovernedMemoryDisplay = getGovernedMemoryDisplay(memory)
): PresentedMemoryItem {
  return {
    id: memory.id,
    title: governed.content,
    statusLabel: memory.status,
    riskLabel: memory.risk_level,
    riskLevel: memory.risk_level,
    pinned: memory.pinned,
    keywords: governed.keywords,
    scorePercent: Math.round(memory.priority_score * 100),
    progressPercent: clampProgress(memory.priority_score),
    lastActivatedLabel: compactDate(memory.last_activated),
    activationCount: memory.activation_count,
    infoTypeLabel: startCase(memory.info_type ?? "general"),
    sourceLabel: governed.source_label,
    governanceTierLabel: governed.tier_label
  };
}

export function presentStructuredMemoryItem(memory: StructuredMemoryRecord): PresentedMemoryItem {
  return {
    id: memory.id,
    title: memory.content,
    statusLabel: memory.status,
    riskLabel: `${memory.riskLevel} risk`,
    riskLevel: memory.riskLevel,
    pinned: memory.pinned,
    keywords: memory.keywords,
    scorePercent: Math.round(memory.importance * 100),
    progressPercent: clampProgress(memory.importance),
    lastActivatedLabel: compactDate(memory.lastActivatedAt),
    activationCount: memory.activationCount,
    infoTypeLabel: startCase(memory.metadata?.infoType ?? "general"),
    sourceLabel: startCase(memory.metadata?.originTrustLevel),
    storageLabel: memory.storagePath
  };
}
