export type MemoryStatus = "active" | "softened" | "hidden";
export type RiskLevel = "low" | "medium" | "high";

export type StructuredMemoryRecord = {
  id: string;
  content: string;
  keywords: string[];
  status: MemoryStatus;
  pinned: boolean;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  lastActivatedAt?: string;
  activationCount: number;
  importance: number;
  sourceEventIds: string[];
  sourcePaths: string[];
  storagePath: string;
  metadata?: {
    infoType?: "medical" | "financial" | "preference" | "behavioral" | "identity";
    originContext?: string;
    originTrustLevel?: "public" | "consent-required" | "reciprocity" | "confidentiality";
  };
};

export type StorageInfo = {
  memoryStorePath: string;
  captureStorePath?: string;
  vectorStorePath?: string;
  storageType: "json" | "sqlite" | "hybrid";
  providerName: string;
};

export type MemoryTrace = {
  memoryId: string;
  sourceEventIds: string[];
  sourcePaths: string[];
  extractionNotes?: string;
};

export type MemoryAction =
  | { type: "pin"; memoryId: string }
  | { type: "soften"; memoryId: string }
  | { type: "hide"; memoryId: string }
  | { type: "restore"; memoryId: string };

export type WeightedKeyword = {
  keyword: string;
  weight: number;
};

export type MemoryTheme = {
  label: string;
  weight: number;
  memoryIds: string[];
};

export type MemorySnapshot = {
  total: number;
  active: number;
  softened: number;
  hidden: number;
  pinned: number;
  highRisk: number;
  topKeywords: WeightedKeyword[];
  topThemes: MemoryTheme[];
};

export type DashboardState = {
  storageInfo: StorageInfo | null;
  snapshot: MemorySnapshot | null;
  memories: StructuredMemoryRecord[];
  selectedMemoryId: string | null;
  selectedTrace: MemoryTrace | null;
  isLoading: boolean;
  error: string | null;
};

export type HostKind = "codex" | "claude-code" | "generic";

export type HostCapabilities = {
  sidebar: boolean;
  localPathsVisible: boolean;
  providerInjection: boolean;
};

export type HostContext = {
  kind: HostKind;
  displayName: string;
  description: string;
  capabilities: HostCapabilities;
  launchHints: string[];
};

export type MemoryProvider = {
  getStorageInfo(): Promise<StorageInfo>;
  getSnapshot(): Promise<MemorySnapshot>;
  listMemories(): Promise<StructuredMemoryRecord[]>;
  getMemoryTrace(memoryId: string): Promise<MemoryTrace>;
  applyAction(action: MemoryAction): Promise<void>;
  subscribe?(listener: () => void): () => void;
};
