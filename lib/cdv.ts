import { type MemoryUnit } from "./memory.ts";

export type TPLevel = "public" | "consent-required" | "reciprocity" | "confidentiality";
export type ContextCategory = "preference" | "medical" | "financial" | "unknown";
export type CDVSeverity = "none" | "warning" | "critical";

export type CDVMemoryUnit = MemoryUnit & {
  origin_context: string;
  origin_tp: TPLevel;
};

export type CDVResult = {
  is_violation: boolean;
  severity: CDVSeverity;
  reason: string;
};

// Poset ordering: public < consent-required < reciprocity < confidentiality
const TP_RANK: Record<TPLevel, number> = {
  public: 0,
  "consent-required": 1,
  reciprocity: 2,
  confidentiality: 3
};

const CATEGORY_BASELINE: Record<Exclude<ContextCategory, "unknown">, TPLevel> = {
  preference: "public",
  medical: "confidentiality",
  financial: "consent-required"
};

const CATEGORY_KEYWORDS: Record<Exclude<ContextCategory, "unknown">, readonly string[]> = {
  medical: [
    "health", "medical", "doctor", "patient", "diagnosis", "diagnose",
    "treatment", "prescription", "therapy", "symptom", "condition",
    "hospital", "clinic", "medication", "disease", "surgery", "nurse"
  ],
  financial: [
    "bank", "payment", "finance", "financial", "income", "salary",
    "credit", "debt", "investment", "tax", "account", "transaction",
    "loan", "insurance", "mortgage", "budget", "revenue", "expense"
  ],
  preference: [
    "preference", "like", "dislike", "favorite", "style", "aesthetic",
    "interest", "hobby", "choice", "opinion", "taste", "enjoys", "prefer"
  ]
};

function classifyContext(context: string): ContextCategory {
  const normalized = context.toLowerCase();
  const tokens = normalized.split(/\W+/).filter(Boolean);

  const scores: Record<Exclude<ContextCategory, "unknown">, number> = {
    medical: 0,
    financial: 0,
    preference: 0
  };

  for (const token of tokens) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
      Exclude<ContextCategory, "unknown">,
      readonly string[]
    ][]) {
      if (keywords.some((keyword) => keyword === token || token.includes(keyword) || keyword.includes(token))) {
        scores[category]++;
      }
    }
  }

  const best = (Object.entries(scores) as [Exclude<ContextCategory, "unknown">, number][]).reduce(
    (top, entry) => (entry[1] > top[1] ? entry : top),
    ["preference" as Exclude<ContextCategory, "unknown">, -1] as [Exclude<ContextCategory, "unknown">, number]
  );

  return best[1] > 0 ? best[0] : "unknown";
}

function resolveCurrentTP(currentContext: string): { tp: TPLevel; category: ContextCategory } {
  const category = classifyContext(currentContext);

  if (category === "unknown") {
    // Conservative: unknown context is treated as public (most permissive),
    // which maximises violation detection for sensitive origin memories.
    return { tp: "public", category: "unknown" };
  }

  return { tp: CATEGORY_BASELINE[category], category };
}

function buildReason(
  memory: CDVMemoryUnit,
  currentCategory: ContextCategory,
  currentTP: TPLevel,
  gap: number
): string {
  const originCategory = classifyContext(memory.origin_context);
  const originLabel = originCategory === "unknown" ? `"${memory.origin_context}"` : originCategory;
  const currentLabel = currentCategory === "unknown" ? "an unrecognised" : currentCategory;

  if (gap === 0) {
    return (
      `Memory originated in a ${originLabel} context (TP: ${memory.origin_tp}). ` +
      `Current context is ${currentLabel} (TP: ${currentTP}). No contextual drift detected.`
    );
  }

  if (gap === 1) {
    return (
      `Memory originated in a ${originLabel} context with TP baseline "${memory.origin_tp}", ` +
      `but is being used in a ${currentLabel} context (TP: "${currentTP}"). ` +
      `This is a minor contextual drift — the destination norm is weaker than the origin norm.`
    );
  }

  return (
    `Memory originated in a ${originLabel} context with TP baseline "${memory.origin_tp}", ` +
    `but is being used in a ${currentLabel} context (TP: "${currentTP}"). ` +
    `This is a severe contextual drift — the destination norm is significantly weaker than the origin norm, ` +
    `violating the contextual integrity constraints of the TP poset.`
  );
}

export function detectCDV(current_context: string, memory: CDVMemoryUnit): CDVResult {
  const { tp: currentTP, category: currentCategory } = resolveCurrentTP(current_context);
  const originRank = TP_RANK[memory.origin_tp];
  const currentRank = TP_RANK[currentTP];
  const gap = originRank - currentRank;

  const is_violation = gap > 0;
  const severity: CDVSeverity = gap <= 0 ? "none" : gap === 1 ? "warning" : "critical";
  const reason = buildReason(memory, currentCategory, currentTP, Math.max(0, gap));

  return { is_violation, severity, reason };
}
