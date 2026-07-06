import { type DashboardInfoType, type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";

export type DashboardVisibilityTier = "full" | "soft-mask" | "protected";
export type DashboardHideConfirmationTier = "soft" | "strong";

export type GovernedMemoryDisplay = {
  content: string;
  hide_confirmation_tier: DashboardHideConfirmationTier;
  keywords: string[];
  source_label: string;
  tier: DashboardVisibilityTier;
  tier_label: string;
};

const RISK_RANK: Record<DashboardMemoryRecord["risk_level"], number> = {
  low: 0,
  medium: 1,
  high: 2
};

const ORIGIN_RANK: Record<NonNullable<DashboardMemoryRecord["origin_tp"]>, number> = {
  public: 0,
  "consent-required": 1,
  reciprocity: 1,
  confidentiality: 2
};

const INFO_RANK: Record<DashboardInfoType, number> = {
  preference: 0,
  behavioral: 1,
  financial: 1,
  medical: 2,
  identity: 2
};

const TIER_BY_RANK: Record<number, DashboardVisibilityTier> = {
  0: "full",
  1: "soft-mask",
  2: "protected"
};

const SENSITIVE_KEYWORDS = new Set([
  "medical",
  "health",
  "diagnosis",
  "treatment",
  "patient",
  "financial",
  "salary",
  "bank",
  "debt",
  "profile",
  "identity",
  "sensitive",
  "privacy"
]);

function startCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function createProtectedLabel(memory: DashboardMemoryRecord): string {
  if (memory.info_type) {
    return `Protected ${memory.info_type} memory`;
  }

  if (memory.origin_tp === "confidentiality") {
    return "Protected confidential memory";
  }

  return `Protected ${memory.risk_level} risk memory`;
}

function createSoftMaskContent(content: string): string {
  const words = content.split(/\s+/).filter(Boolean);

  if (words.length <= 8) {
    return content;
  }

  return `${words.slice(0, 8).join(" ")} ...`;
}

function sanitizeKeyword(keyword: string, infoType?: DashboardInfoType): string {
  const normalized = keyword.trim().toLowerCase();

  if (!SENSITIVE_KEYWORDS.has(normalized)) {
    return keyword;
  }

  if (infoType) {
    return startCase(infoType);
  }

  return "Sensitive";
}

export function resolveDashboardVisibilityTier(
  memory: Pick<DashboardMemoryRecord, "info_type" | "origin_tp" | "risk_level">
): DashboardVisibilityTier {
  const riskRank = RISK_RANK[memory.risk_level];
  const originRank = memory.origin_tp ? ORIGIN_RANK[memory.origin_tp] : 0;
  const infoRank = memory.info_type ? INFO_RANK[memory.info_type] : 0;

  return TIER_BY_RANK[Math.max(riskRank, originRank, infoRank)];
}

export function getGovernedMemoryDisplay(memory: DashboardMemoryRecord): GovernedMemoryDisplay {
  const tier = resolveDashboardVisibilityTier(memory);

  if (tier === "full") {
    return {
      tier,
      tier_label: "Full view",
      hide_confirmation_tier: "soft",
      content: memory.content,
      keywords: memory.keywords.slice(0, 6),
      source_label: startCase(memory.origin_tp ?? "public")
    };
  }

  if (tier === "soft-mask") {
    return {
      tier,
      tier_label: "Soft mask",
      hide_confirmation_tier: "soft",
      content: createSoftMaskContent(memory.content),
      keywords: memory.keywords.slice(0, 3).map((keyword) => sanitizeKeyword(keyword, memory.info_type)),
      source_label: startCase(memory.origin_tp ?? "consent-required")
    };
  }

  const protectedKeywords = [
    "Protected",
    startCase(memory.info_type ?? "sensitive"),
    startCase(memory.origin_tp ?? "confidentiality")
  ];

  return {
    tier,
    tier_label: "Protected view",
    hide_confirmation_tier: "strong",
    content: createProtectedLabel(memory),
    keywords: protectedKeywords,
    source_label: startCase(memory.origin_tp ?? "confidentiality")
  };
}

