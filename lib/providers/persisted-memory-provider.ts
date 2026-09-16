import { deriveMemorySnapshot } from "../plugin-derive.ts";
import type { MemoryProvider, StructuredMemoryRecord } from "../plugin-types.ts";
import type { PersistedMemoryRecord } from "../memory-store.ts";
import { notifyMemoryChange, subscribeMemoryChanges } from "../memory-events.ts";

async function read() {
  const response = await fetch("/api/memories", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data as { records: PersistedMemoryRecord[]; revision: string };
}
function convert(m: PersistedMemoryRecord): StructuredMemoryRecord {
  return { id: m.id, content: m.content, keywords: m.keywords, status: m.status === "forgotten" ? "hidden" : m.status,
    pinned: m.pinned, riskLevel: m.risk_level, createdAt: m.created_at, updatedAt: m.updated_at ?? m.created_at,
    lastActivatedAt: m.last_activated, activationCount: m.activation_count, importance: m.base_importance,
    sourceEventIds: [], sourcePaths: [], storagePath: "Pensieve local repository",
    metadata: { infoType: m.info_type, originContext: m.origin_context, originTrustLevel: m.origin_tp } };
}
const provider: MemoryProvider = {
  async getStorageInfo() { return { memoryStorePath: "Pensieve local repository (server)", storageType: "json", providerName: "pensieve-file-repository" }; },
  async listMemories() { return (await read()).records.map(convert); },
  async getSnapshot() { return deriveMemorySnapshot(await this.listMemories()); },
  async getMemoryTrace(id) {
    const memory = (await read()).records.find(m => m.id === id);
    if (!memory) throw new Error("Memory not found / 记忆不存在");
    return { memoryId: id, sourceEventIds: [], sourcePaths: [],
      extractionNotes: memory.origin_context ?? "Imported/local record; no verified host capture trace." };
  },
  async applyAction(action) {
    const library = await read();
    const memory = library.records.find(m => m.id === action.memoryId);
    if (!memory) throw new Error("Memory not found / 记忆不存在");
    const status = action.type === "hide" ? "forgotten" : action.type === "restore" ? "active" :
      action.type === "soften" ? memory.status === "softened" ? "active" : "softened" : memory.status;
    const response = await fetch("/api/memories", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "govern", revision: library.revision,
        changes: [{ id: memory.id, status, pinned: action.type === "pin" ? !memory.pinned : memory.pinned }] }) });
    if (!response.ok) throw new Error((await response.json()).error);
    notifyMemoryChange();
  },
  subscribe: subscribeMemoryChanges
};
export function getPersistedMemoryProvider(): MemoryProvider { return provider; }
