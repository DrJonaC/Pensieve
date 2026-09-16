import type { PersistedMemoryRecord } from "./memory-store.ts";

export const MAX_IMPORT_BYTES = 1_000_000;
export class MemoryInputError extends Error {}
const fail = (): never => { throw new MemoryInputError("Invalid memory file / 记忆文件格式不正确"); };
const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));

export function isMemoryRecord(value: unknown): value is PersistedMemoryRecord {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return typeof m.id === "string" && m.id.trim().length > 0 && m.id.length <= 200 &&
    !["__proto__", "constructor", "prototype"].includes(m.id) &&
    typeof m.content === "string" && m.content.trim().length > 0 && m.content.length <= 10000 &&
    Array.isArray(m.keywords) && m.keywords.length <= 100 && m.keywords.every(k => typeof k === "string" && k.length <= 200) &&
    date(m.created_at) && date(m.last_activated) && (m.updated_at === undefined || date(m.updated_at)) &&
    Number.isInteger(m.activation_count) && Number(m.activation_count) >= 0 &&
    typeof m.base_importance === "number" && Number.isFinite(m.base_importance) && m.base_importance >= 0 && m.base_importance <= 1 &&
    typeof m.pinned === "boolean" && ["active", "softened", "forgotten"].includes(String(m.status)) &&
    ["low", "medium", "high"].includes(String(m.risk_level)) &&
    (m.info_type === undefined || ["medical", "financial", "preference", "behavioral", "identity"].includes(String(m.info_type))) &&
    (m.origin_context === undefined || (typeof m.origin_context === "string" && m.origin_context.length <= 1000)) &&
    (m.origin_tp === undefined || ["public", "consent-required", "reciprocity", "confidentiality"].includes(String(m.origin_tp)));
}

export function validateRecords(value: unknown): PersistedMemoryRecord[] {
  if (!Array.isArray(value) || value.length > 2000 || !value.every(isMemoryRecord)) return fail();
  if (new Set(value.map(m => m.id)).size !== value.length) return fail();
  if (new TextEncoder().encode(JSON.stringify(value)).length > 950000) throw new MemoryInputError("Library exceeds safe backup size (950 KB) / 记忆库超过安全备份上限（950 KB）");
  return value.map(m => ({ ...m, keywords: [...m.keywords] }));
}

export function parseMemoryImport(text: string, format: "json" | "text", now = new Date().toISOString()): PersistedMemoryRecord[] {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new MemoryInputError("File exceeds 1 MB / 文件超过 1 MB");
  if (format === "json") {
    let value: unknown;
    try { value = JSON.parse(text); } catch { return fail(); }
    if (Array.isArray(value)) return validateRecords(value);
    if (!value || typeof value !== "object") return fail();
    const file = value as Record<string, unknown>;
    if (file.format !== "pensieve-memory" || file.version !== 1) return fail();
    return validateRecords(file.memories);
  }
  const lines = text.split(/\r?\n/).map(line => line.replace(/^\s*[-*•]\s+/, "").trim()).filter(Boolean);
  if (lines.length === 0 || lines.length > 2000 || lines.some(line => line.length > 10000)) return fail();
  return lines.map(content => ({
    id: `import-${crypto.randomUUID()}`, content, keywords: [], created_at: now,
    updated_at: now, last_activated: now, activation_count: 0, base_importance: 0.5,
    risk_level: "medium", status: "active", pinned: false,
    origin_context: "User-imported text (not independently verified)", origin_tp: "consent-required"
  }));
}

export function mergeMemoryImport(current: readonly PersistedMemoryRecord[], incoming: readonly PersistedMemoryRecord[]) {
  const ids = new Set(current.map(m => m.id));
  const contents = new Set(current.map(m => m.content.trim().toLowerCase()));
  const added: PersistedMemoryRecord[] = [];
  for (const m of incoming) {
    const content = m.content.trim().toLowerCase();
    if (ids.has(m.id) || contents.has(content)) continue;
    added.push(m); ids.add(m.id); contents.add(content);
  }
  if (current.length + added.length > 2000) return fail();
  return { records: validateRecords([...current, ...added]), added: added.length, skipped: incoming.length - added.length };
}

export function exportMemoryJson(memories: readonly PersistedMemoryRecord[]): string {
  return JSON.stringify({ format: "pensieve-memory", version: 1, exported_at: new Date().toISOString(), memories });
}
