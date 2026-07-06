import {
  hydrateMemoryDatabase,
  type MemoryDatabase,
  type MemoryDatabaseSnapshot,
  type RetrievalRiskLevel,
  type RetrievalStatus
} from "./memory-rag.ts";

export type PersistedMemoryRecord = {
  id: string;
  content: string;
  keywords: string[];
  created_at: string;
  last_activated: string;
  activation_count: number;
  base_importance: number;
  pinned: boolean;
  risk_level: RetrievalRiskLevel;
  status: RetrievalStatus;
  updated_at?: string;
  info_type?: "medical" | "financial" | "preference" | "behavioral" | "identity";
  origin_context?: string;
  origin_tp?: "public" | "consent-required" | "reciprocity" | "confidentiality";
};

export type MemoryRepository = {
  getRecords: () => readonly PersistedMemoryRecord[];
  getDatabase: () => MemoryDatabase;
};

const persistedMetadata: PersistedMemoryRecord[] = [
  {
    id: "memory-1",
    content: "The user prefers concise breakdowns with strong visual structure.",
    keywords: ["concise", "breakdowns", "visual", "structure", "clear"],
    created_at: "2026-01-08T09:00:00.000Z",
    last_activated: "2026-04-08T13:20:00.000Z",
    activation_count: 14,
    base_importance: 0.82,
    pinned: false,
    risk_level: "low",
    status: "active",
    info_type: "preference",
    origin_context: "preference chat",
    origin_tp: "public"
  },
  {
    id: "memory-2",
    content: "The user is building an AI product centered on memory transparency and trust.",
    keywords: ["ai", "memory", "transparency", "trust", "product"],
    created_at: "2026-02-03T18:10:00.000Z",
    last_activated: "2026-04-07T16:45:00.000Z",
    activation_count: 11,
    base_importance: 0.76,
    pinned: false,
    risk_level: "medium",
    status: "active",
    info_type: "behavioral",
    origin_context: "work discussion",
    origin_tp: "consent-required"
  },
  {
    id: "memory-3",
    content: "The user favors dark interfaces with calm, research-oriented aesthetics.",
    keywords: ["dark", "interface", "calm", "research", "minimal"],
    created_at: "2026-02-19T11:30:00.000Z",
    last_activated: "2026-04-05T08:00:00.000Z",
    activation_count: 9,
    base_importance: 0.63,
    pinned: false,
    risk_level: "low",
    status: "active",
    info_type: "preference",
    origin_context: "preference chat",
    origin_tp: "public"
  },
  {
    id: "memory-4",
    content: "The user has explored sensitive profile inferences before, so privacy framing matters.",
    keywords: ["sensitive", "privacy", "profile", "risk", "inferences"],
    created_at: "2026-03-14T14:05:00.000Z",
    last_activated: "2026-03-29T10:25:00.000Z",
    activation_count: 4,
    base_importance: 0.48,
    pinned: false,
    risk_level: "high",
    status: "active",
    info_type: "medical",
    origin_context: "health discussion",
    origin_tp: "confidentiality"
  },
  {
    id: "memory-5",
    content: "The user often asks for modular architecture that can grow beyond the MVP.",
    keywords: ["modular", "architecture", "mvp", "extensible", "clean"],
    created_at: "2026-03-28T20:15:00.000Z",
    last_activated: "2026-04-09T19:40:00.000Z",
    activation_count: 7,
    base_importance: 0.71,
    pinned: false,
    risk_level: "medium",
    status: "active",
    info_type: "behavioral",
    origin_context: "work discussion",
    origin_tp: "consent-required"
  }
];

export const memoryDatabaseSnapshot: MemoryDatabaseSnapshot = {
  metadata: [
    {
      id: "memory-1",
      content: "The user prefers concise breakdowns with strong visual structure.",
      keywords: ["concise", "breakdowns", "visual", "structure", "clear"],
      created_at: "2026-01-08T09:00:00.000Z",
      last_activated: "2026-04-08T13:20:00.000Z",
      activation_count: 14,
      base_importance: 0.82,
      risk_level: "low",
      status: "active",
      search_terms: ["concise", "breakdown", "visual", "structure", "clear", "the", "user", "prefer", "with", "strong"]
    },
    {
      id: "memory-2",
      content: "The user is building an AI product centered on memory transparency and trust.",
      keywords: ["ai", "memory", "transparency", "trust", "product"],
      created_at: "2026-02-03T18:10:00.000Z",
      last_activated: "2026-04-07T16:45:00.000Z",
      activation_count: 11,
      base_importance: 0.76,
      risk_level: "medium",
      status: "active",
      search_terms: ["ai", "memory", "transparency", "trust", "product", "the", "user", "is", "build", "an", "center", "on", "and"]
    },
    {
      id: "memory-3",
      content: "The user favors dark interfaces with calm, research-oriented aesthetics.",
      keywords: ["dark", "interface", "calm", "research", "minimal"],
      created_at: "2026-02-19T11:30:00.000Z",
      last_activated: "2026-04-05T08:00:00.000Z",
      activation_count: 9,
      base_importance: 0.63,
      risk_level: "low",
      status: "active",
      search_terms: ["dark", "interface", "calm", "research", "minimal", "the", "user", "favor", "with", "research-orient", "aesthetic"]
    },
    {
      id: "memory-4",
      content: "The user has explored sensitive profile inferences before, so privacy framing matters.",
      keywords: ["sensitive", "privacy", "profile", "risk", "inferences"],
      created_at: "2026-03-14T14:05:00.000Z",
      last_activated: "2026-03-29T10:25:00.000Z",
      activation_count: 4,
      base_importance: 0.48,
      risk_level: "high",
      status: "active",
      search_terms: ["sensitive", "privacy", "profile", "risk", "inference", "the", "user", "has", "explor", "before", "so", "fram", "matter"]
    },
    {
      id: "memory-5",
      content: "The user often asks for modular architecture that can grow beyond the MVP.",
      keywords: ["modular", "architecture", "mvp", "extensible", "clean"],
      created_at: "2026-03-28T20:15:00.000Z",
      last_activated: "2026-04-09T19:40:00.000Z",
      activation_count: 7,
      base_importance: 0.71,
      risk_level: "medium",
      status: "active",
      search_terms: ["modular", "architecture", "mvp", "extensible", "clean", "the", "user", "often", "ask", "for", "that", "can", "grow", "beyond"]
    }
  ],
  vectors: [
    { id: "memory-1", embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0.4, 0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.4, 0, 0.2, 0, 0, 0.2, 0.4, 0.2] },
    { id: "memory-2", embedding: [0, 0.377964, 0.188982, 0.188982, 0, 0, 0, 0, 0, 0.188982, 0, 0, 0.188982, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.188982, 0, 0.377964, 0, 0, 0, 0, 0.188982, 0, 0, 0.377964, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.188982, 0.377964, 0.377964, 0.188982, 0, 0] },
    { id: "memory-3", embedding: [0.196116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.392232, 0, 0, 0, 0, 0, 0.392232, 0, 0, 0.196116, 0, 0, 0, 0, 0, 0.392232, 0, 0, 0, 0.392232, 0, 0, 0, 0, 0, 0, 0, 0, 0.392232, 0.196116, 0, 0, 0, 0, 0, 0, 0.196116, 0, 0, 0.196116, 0, 0.196116] },
    { id: "memory-4", embedding: [0, 0, 0, 0, 0, 0, 0.188982, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.188982, 0, 0, 0, 0.188982, 0, 0.188982, 0.377964, 0, 0, 0.188982, 0, 0, 0, 0, 0, 0, 0, 0.377964, 0, 0.377964, 0, 0, 0.377964, 0.377964, 0.188982, 0, 0, 0, 0.188982, 0, 0, 0.188982, 0, 0] },
    { id: "memory-5", embedding: [0, 0, 0, 0, 0.371391, 0.185695, 0, 0.185695, 0, 0, 0, 0.185695, 0, 0.371391, 0, 0, 0, 0, 0.371391, 0, 0.185695, 0, 0.185695, 0, 0, 0, 0, 0, 0, 0, 0.371391, 0.371391, 0.185695, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.185695, 0.185695, 0, 0, 0.185695, 0, 0] }
  ],
  vocabulary: [
    "aesthetic", "ai", "an", "and", "architecture", "ask", "before", "beyond", "breakdown", "build", "calm", "can", "center", "clean", "clear", "concise", "dark", "explor", "extensible", "favor", "for", "fram", "grow", "has", "inference", "interface", "is", "matter", "memory", "minimal", "modular", "mvp", "often", "on", "prefer", "privacy", "product", "profile", "research", "research-orient", "risk", "sensitive", "so", "strong", "structure", "that", "the", "transparency", "trust", "user", "visual", "with"
  ]
};

let cachedDatabase: MemoryDatabase | null = null;

export function loadMemoryDatabase(): MemoryDatabase {
  if (!cachedDatabase) {
    cachedDatabase = hydrateMemoryDatabase(memoryDatabaseSnapshot);
  }

  return cachedDatabase;
}

export function loadBaseMemories(): readonly PersistedMemoryRecord[] {
  return persistedMetadata;
}

export function createMemoryRepository(): MemoryRepository {
  return {
    getRecords: () => persistedMetadata,
    getDatabase: () => loadMemoryDatabase()
  };
}

export const memoryRepository = createMemoryRepository();
export const baseMemories = Object.freeze([...persistedMetadata]) as readonly PersistedMemoryRecord[];
