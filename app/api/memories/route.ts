import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/request-safety";
import { safeErrorMessage } from "@/lib/privacy-server";
import { readPensieveRepository, mutateMemoryRepository, repositoryRevision, RepositoryConflictError } from "@/lib/pensieve-file-repository";
import { MemoryInputError, mergeMemoryImport, validateRecords, MAX_IMPORT_BYTES } from "@/lib/memory-transfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await readPensieveRepository();
    return NextResponse.json({ records, revision: repositoryRevision(records) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Cannot read memory store; existing data was preserved / 无法读取记忆库，原数据未被覆盖" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid origin / 来源无效" }, { status: 403 });
  try {
    // Bound the body before parsing, including chunked requests.
    const reader = request.body?.getReader();
    if (!reader) throw new MemoryInputError("Empty request / 请求为空");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_IMPORT_BYTES * 2) { await reader.cancel(); throw new MemoryInputError("Request too large / 请求过大"); }
      chunks.push(value);
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new MemoryInputError("Invalid JSON / JSON 无效"); }
    if (!body || typeof body.revision !== "string") throw new MemoryInputError("Missing revision / 缺少版本标识");
    const result = await mutateMemoryRepository(body.revision, records => {
      if (body.operation === "import") {
        if (body.format !== "pensieve-memory" || body.version !== 1) throw new MemoryInputError("Unsupported import version / 不支持的导入版本");
        return mergeMemoryImport(records, validateRecords(body.memories)).records;
      }
      if (body.operation === "govern") {
        if (!Array.isArray(body.changes) || body.changes.length > 2000) throw new MemoryInputError("Invalid changes / 无效修改");
        const changes = new Map<string, { pinned: boolean; status: "active" | "softened" | "forgotten" }>();
        for (const change of body.changes) {
          if (!change || typeof change.id !== "string" || typeof change.pinned !== "boolean" ||
              !["active", "softened", "forgotten"].includes(change.status)) throw new MemoryInputError("Invalid state / 无效状态");
          changes.set(change.id, change);
        }
        return records.map(memory => {
          const change = changes.get(memory.id);
          return change ? { ...memory, pinned: change.pinned, status: change.status, updated_at: new Date().toISOString() } : memory;
        });
      }
      if (body.operation !== "edit" && body.operation !== "delete") throw new MemoryInputError("Unknown operation / 不支持的操作");
      if (typeof body.id !== "string" || !records.some(m => m.id === body.id)) throw new MemoryInputError("Memory not found / 记忆不存在");
      if (body.operation === "delete") return records.filter(m => m.id !== body.id);
      if (typeof body.content !== "string" || !body.content.trim() || body.content.length > 10000 ||
        !Array.isArray(body.keywords) || body.keywords.length > 100 || !body.keywords.every((k: unknown) => typeof k === "string" && k.length <= 200)) {
        throw new MemoryInputError("Invalid content or keywords / 内容或关键词无效");
      }
      return records.map(m => m.id === body.id ? { ...m, content: body.content.trim(), keywords: [...new Set<string>(body.keywords)], updated_at: new Date().toISOString() } : m);
    });
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof RepositoryConflictError ? 409 : error instanceof MemoryInputError ? 400 : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to save memories / 无法保存记忆" : safeErrorMessage(error, "Invalid request / 无效请求") }, { status });
  }
}
