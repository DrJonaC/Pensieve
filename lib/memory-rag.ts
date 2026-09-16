export type RetrievalRiskLevel = "low" | "medium" | "high";
export type RetrievalStatus = "active" | "softened" | "forgotten";

export type MemoryRetrievalInput = {
  id: string;
  content: string;
  keywords: string[];
  created_at: string;
  last_activated: string;
  activation_count: number;
  base_importance: number;
  risk_level: RetrievalRiskLevel;
  status: RetrievalStatus;
};

export type MemoryRetrievalModifier = {
  pinned: boolean;
  status: RetrievalStatus;
};

export type MemoryRetrievalModifierMap = Record<string, MemoryRetrievalModifier>;

export type MemoryVectorRecord = {
  id: string;
  embedding: number[];
};

export type MemoryMetadataRecord = MemoryRetrievalInput & {
  search_terms: string[];
};

export type MemoryDatabase = {
  metadataStore: Map<string, MemoryMetadataRecord>;
  vectorStore: Map<string, MemoryVectorRecord>;
  vocabulary: string[];
  vocabularyIndex: Map<string, number>;
};

export type MemoryDatabaseSnapshot = {
  metadata: MemoryMetadataRecord[];
  vectors: MemoryVectorRecord[];
  vocabulary: string[];
};

export type RetrievalBreakdown = {
  semantic_similarity: number;
  lexical_overlap: number;
  recency_boost: number;
  importance_boost: number;
  pin_boost: number;
  soften_penalty: number;
};

export type RetrievedMemory = MemoryRetrievalInput & {
  pinned: boolean;
  relevance_score: number;
  matched_terms: string[];
  score_breakdown: RetrievalBreakdown;
};

export type RetrievalHeatmapCell = {
  token: string;
  memoryId: string;
  score: number;
};

export type MemoryRetrievalResult = {
  tokens: string[];
  memories: RetrievedMemory[];
  topK: RetrievedMemory[];
  reasons: Record<string, string>;
  heatmap: RetrievalHeatmapCell[];
  hiddenMemoryIds: string[];
};

export type RetrieveMemoriesOptions = {
  query: string;
  database: MemoryDatabase;
  modifiers: MemoryRetrievalModifierMap;
  topK?: number;
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const RECENCY_WINDOW_DAYS = 30;
const MAX_ACTIVATION_COUNT = 20;

function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

function normalizeToken(token: string): string {
  const cleaned = token.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
  if (cleaned.length <= 3) {
    return cleaned;
  }

  if (cleaned.endsWith("ies")) {
    return `${cleaned.slice(0, -3)}y`;
  }

  if (cleaned.endsWith("ing") && cleaned.length > 5) {
    return cleaned.slice(0, -3);
  }

  if (cleaned.endsWith("ed") && cleaned.length > 4) {
    return cleaned.slice(0, -2);
  }

  if (cleaned.endsWith("s") && !cleaned.endsWith("ss")) {
    return cleaned.slice(0, -1);
  }

  return cleaned;
}

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function uniqueTokens(tokens: readonly string[]): string[] {
  return [...new Set(tokens)];
}

function buildSearchTerms(memory: MemoryRetrievalInput): string[] {
  const contentTerms = tokenize(memory.content);
  const keywordTerms = memory.keywords.flatMap((keyword) => tokenize(keyword));
  return uniqueTokens([...keywordTerms, ...contentTerms]);
}

function createEmbedding(tokens: readonly string[], vocabularyIndex: Map<string, number>): number[] {
  const vector = Array.from({ length: vocabularyIndex.size }, () => 0);
  let magnitude = 0;

  tokens.forEach((token) => {
    const index = vocabularyIndex.get(token);
    if (index === undefined) {
      return;
    }

    vector[index] += 1;
  });

  vector.forEach((value) => {
    magnitude += value ** 2;
  });

  if (magnitude === 0) {
    return vector;
  }

  const normalizedMagnitude = Math.sqrt(magnitude);
  return vector.map((value) => value / normalizedMagnitude);
}

function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length || left.length === 0) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += left[index] * right[index];
  }

  return clampScore(total);
}

function computeLexicalOverlap(queryTerms: readonly string[], memoryTerms: readonly string[]): {
  matchedTerms: string[];
  score: number;
} {
  const matches = uniqueTokens(
    queryTerms.filter((queryTerm) =>
      memoryTerms.some((memoryTerm) => memoryTerm === queryTerm || memoryTerm.includes(queryTerm) || queryTerm.includes(memoryTerm))
    )
  );

  return {
    matchedTerms: matches,
    score: matches.length === 0 ? 0 : clampScore(matches.length / Math.max(queryTerms.length, 1))
  };
}

function computeRecencyBoost(lastActivated: string): number {
  const activatedAt = Date.parse(lastActivated);
  if (Number.isNaN(activatedAt)) {
    return 0;
  }

  const ageInDays = Math.max(0, (Date.now() - activatedAt) / DAY_IN_MS);
  return clampScore(1 - ageInDays / RECENCY_WINDOW_DAYS) * 0.08;
}

function computeImportanceBoost(memory: MemoryRetrievalInput): number {
  const activationWeight = clampScore(memory.activation_count / MAX_ACTIVATION_COUNT);
  const combinedImportance = clampScore(memory.base_importance * 0.7 + activationWeight * 0.3);
  return combinedImportance * 0.2;
}

function buildReason(memory: RetrievedMemory): string {
  const parts: string[] = [];

  if (memory.matched_terms.length > 0) {
    parts.push(`Matched terms: ${memory.matched_terms.join(", ")}`);
  } else if (memory.score_breakdown.semantic_similarity > 0.15) {
    parts.push("Surfaced through broader semantic alignment");
  } else {
    parts.push("Kept available through background memory relevance");
  }

  if (memory.pinned) {
    parts.push("Pinned state increased its priority");
  }

  if (memory.status === "softened") {
    parts.push("This memory is softened, so its influence was reduced");
  }

  return `${parts.join(". ")}.`;
}

export function createMemoryDatabase(memories: readonly MemoryRetrievalInput[]): MemoryDatabase {
  const metadataStore = new Map<string, MemoryMetadataRecord>();
  const vocabulary = uniqueTokens(memories.flatMap(buildSearchTerms)).sort();
  const vocabularyIndex = new Map<string, number>(vocabulary.map((token, index) => [token, index]));
  const vectorStore = new Map<string, MemoryVectorRecord>();

  memories.forEach((memory) => {
    const searchTerms = buildSearchTerms(memory);
    const weightedTerms = [...searchTerms, ...memory.keywords.flatMap((keyword) => tokenize(keyword))];

    metadataStore.set(memory.id, {
      ...memory,
      search_terms: searchTerms
    });

    vectorStore.set(memory.id, {
      id: memory.id,
      embedding: createEmbedding(weightedTerms, vocabularyIndex)
    });
  });

  return {
    metadataStore,
    vectorStore,
    vocabulary,
    vocabularyIndex
  };
}

export function hydrateMemoryDatabase(snapshot: MemoryDatabaseSnapshot): MemoryDatabase {
  const metadataStore = new Map<string, MemoryMetadataRecord>(
    snapshot.metadata.map((memory) => [memory.id, memory])
  );
  const vectorStore = new Map<string, MemoryVectorRecord>(
    snapshot.vectors.map((vector) => [vector.id, vector])
  );
  const vocabulary = [...snapshot.vocabulary];
  const vocabularyIndex = new Map<string, number>(
    vocabulary.map((token, index) => [token, index])
  );

  return {
    metadataStore,
    vectorStore,
    vocabulary,
    vocabularyIndex
  };
}

export function serializeMemoryDatabase(database: MemoryDatabase): MemoryDatabaseSnapshot {
  return {
    metadata: Array.from(database.metadataStore.values()),
    vectors: Array.from(database.vectorStore.values()),
    vocabulary: [...database.vocabulary]
  };
}

export function retrieveMemories({
  query,
  database,
  modifiers,
  topK = 5
}: RetrieveMemoriesOptions): MemoryRetrievalResult {
  const tokens = tokenize(query);
  const queryEmbedding = createEmbedding(tokens, database.vocabularyIndex);
  const reasons: Record<string, string> = {};
  const heatmap: RetrievalHeatmapCell[] = [];
  const hiddenMemoryIds: string[] = [];

  const memories: RetrievedMemory[] = [];

  database.metadataStore.forEach((memory) => {
    const modifier = modifiers[memory.id];
    const status = modifier?.status ?? memory.status;
    const pinned = modifier?.pinned ?? false;

    if (status === "forgotten") {
      hiddenMemoryIds.push(memory.id);
      return;
    }

    const storedVector = database.vectorStore.get(memory.id);
    const semanticSimilarity = storedVector ? cosineSimilarity(queryEmbedding, storedVector.embedding) : 0;
    const lexicalOverlap = computeLexicalOverlap(tokens, memory.search_terms);
    const recencyBoost = computeRecencyBoost(memory.last_activated);
    const importanceBoost = computeImportanceBoost(memory);
    const pinBoost = pinned ? 0.14 : 0;
    const softenPenalty = status === "softened" ? 0.18 : 0;

    tokens.forEach((token) => {
      const tokenEmbedding = createEmbedding([token], database.vocabularyIndex);
      const tokenSemantic = storedVector ? cosineSimilarity(tokenEmbedding, storedVector.embedding) : 0;
      const tokenLexical = lexicalOverlap.matchedTerms.includes(token) ? 1 : 0;

      heatmap.push({
        token,
        memoryId: memory.id,
        score: clampScore(tokenSemantic * 0.7 + tokenLexical * 0.3)
      });
    });

    const relevanceScore = clampScore(
      semanticSimilarity * 0.5 +
        lexicalOverlap.score * 0.18 +
        recencyBoost +
        importanceBoost +
        pinBoost -
        softenPenalty
    );

    const retrievedMemory: RetrievedMemory = {
      ...memory,
      status,
      pinned,
      matched_terms: lexicalOverlap.matchedTerms,
      relevance_score: relevanceScore,
      score_breakdown: {
        semantic_similarity: semanticSimilarity,
        lexical_overlap: lexicalOverlap.score,
        recency_boost: recencyBoost,
        importance_boost: importanceBoost,
        pin_boost: pinBoost,
        soften_penalty: softenPenalty
      }
    };

    reasons[memory.id] = buildReason(retrievedMemory);
    memories.push(retrievedMemory);
  });

  const sortedMemories = [...memories].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.relevance_score - left.relevance_score;
  });

  return {
    tokens,
    memories: sortedMemories,
    topK: sortedMemories.slice(0, Math.max(0, topK)),
    reasons,
    heatmap,
    hiddenMemoryIds
  };
}
