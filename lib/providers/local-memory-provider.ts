import {
  baseMemories,
  loadMemoryDatabase,
  memoryDatabaseSnapshot
} from "../memory-store.ts";
import {
  deriveMemorySnapshot
} from "../plugin-derive.ts";
import {
  type MemoryAction,
  type MemoryProvider,
  type MemorySnapshot,
  type MemoryTrace,
  type StorageInfo,
  type StructuredMemoryRecord
} from "../plugin-types.ts";

type ProviderModifier = {
  pinned: boolean;
  status: StructuredMemoryRecord["status"];
};

const MEMORY_STORE_PATH = "D:\\[]CJNCore\\[02]Work\\[02]Project\\[03] Pensieve\\lib\\memory-store.ts";
const VECTOR_STORE_PATH = "D:\\[]CJNCore\\[02]Work\\[02]Project\\[03] Pensieve\\lib\\memory-store.ts#memoryDatabaseSnapshot";
const CAPTURE_STORE_PATH = "D:\\[]CJNCore\\[02]Work\\[02]Project\\[03] Pensieve\\lib\\memory-store.ts#persistedMetadata";

function toStructuredMemoryRecord(
  record: (typeof baseMemories)[number],
  modifier: ProviderModifier
): StructuredMemoryRecord {
  return {
    id: record.id,
    content: record.content,
    keywords: [...record.keywords],
    status: modifier.status,
    pinned: modifier.pinned,
    riskLevel: record.risk_level,
    createdAt: record.created_at,
    updatedAt: record.last_activated,
    lastActivatedAt: record.last_activated,
    activationCount: record.activation_count,
    importance: record.base_importance,
    sourceEventIds: [`capture:${record.id}`],
    sourcePaths: [CAPTURE_STORE_PATH],
    storagePath: MEMORY_STORE_PATH,
    metadata: {
      infoType: record.info_type,
      originContext: record.origin_context,
      originTrustLevel: record.origin_tp
    }
  };
}

class LocalMemoryProvider implements MemoryProvider {
  private readonly listeners = new Set<() => void>();

  private readonly modifiers = new Map<string, ProviderModifier>(
    baseMemories.map((memory) => [
      memory.id,
      {
        pinned: false,
        status: memory.status === "forgotten" ? "hidden" : memory.status
      }
    ])
  );

  async getStorageInfo(): Promise<StorageInfo> {
    return {
      memoryStorePath: MEMORY_STORE_PATH,
      captureStorePath: CAPTURE_STORE_PATH,
      vectorStorePath: VECTOR_STORE_PATH,
      storageType: "hybrid",
      providerName: "local-pensieve-store"
    };
  }

  async getSnapshot(): Promise<MemorySnapshot> {
    return deriveMemorySnapshot(await this.listMemories());
  }

  async listMemories(): Promise<StructuredMemoryRecord[]> {
    loadMemoryDatabase();

    return baseMemories
      .map((record) => toStructuredMemoryRecord(record, this.modifiers.get(record.id)!))
      .sort((left, right) => {
        if (left.pinned !== right.pinned) {
          return left.pinned ? -1 : 1;
        }

        if (left.status !== right.status) {
          const order = { active: 0, softened: 1, hidden: 2 } as const;
          return order[left.status] - order[right.status];
        }

        return right.importance - left.importance;
      });
  }

  async getMemoryTrace(memoryId: string): Promise<MemoryTrace> {
    const record = baseMemories.find((memory) => memory.id === memoryId);
    if (!record) {
      throw new Error(`Unknown memory trace request: ${memoryId}`);
    }

    return {
      memoryId,
      sourceEventIds: [`capture:${memoryId}`],
      sourcePaths: [CAPTURE_STORE_PATH, MEMORY_STORE_PATH],
      extractionNotes: record.origin_context
        ? `Structured from captured events labeled "${record.origin_context}" and persisted into the local memory store.`
        : "Structured from captured events and persisted into the local memory store."
    };
  }

  async applyAction(action: MemoryAction): Promise<void> {
    const current = this.modifiers.get(action.memoryId);
    if (!current) {
      throw new Error(`Unknown memory action target: ${action.memoryId}`);
    }

    switch (action.type) {
      case "pin":
        this.modifiers.set(action.memoryId, {
          ...current,
          pinned: !current.pinned
        });
        break;
      case "soften":
        this.modifiers.set(action.memoryId, {
          ...current,
          status: current.status === "softened" ? "active" : "softened"
        });
        break;
      case "hide":
        this.modifiers.set(action.memoryId, {
          pinned: false,
          status: "hidden"
        });
        break;
      case "restore":
        this.modifiers.set(action.memoryId, {
          ...current,
          status: "active"
        });
        break;
      default: {
        const exhaustiveCheck: never = action;
        throw new Error(`Unsupported memory action: ${exhaustiveCheck}`);
      }
    }

    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

const localMemoryProvider = new LocalMemoryProvider();

export function getLocalMemoryProvider(): MemoryProvider {
  return localMemoryProvider;
}

export function getMemoryVectorCount(): number {
  return memoryDatabaseSnapshot.vectors.length;
}
