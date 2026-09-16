import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/request-safety";
import { generateResponse } from "@/lib/openai";
import { readPensieveRepository, repositoryRevision } from "@/lib/pensieve-file-repository";
import { activateRepository } from "@/lib/repository-activation";
import { buildMockNarrative } from "@/lib/query";
import { redactGeneratedResponse, redactSensitiveText } from "@/lib/privacy";
import { configuredSecrets } from "@/lib/privacy-server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid origin / 来源无效" }, { status: 403 });
  try {
    const body = await request.json();
    if (!body || typeof body.query !== "string" || body.query.length > 10000 ||
        (body.mode !== "mock" && body.mode !== "live")) {
      return NextResponse.json({ error: "Invalid query / 查询无效" }, { status: 400 });
    }
    const records = await readPensieveRepository();
    const revision = repositoryRevision(records);
    const activation = activateRepository(body.query, records);
    let data = buildMockNarrative(activation);
    let warning: string | null = null;
    if (body.mode !== "mock" && body.query.trim()) {
      try {
        const result = await generateResponse({ query: body.query, memories: activation.memories.slice(0, 3) });
        data = { ...result, provider: "openai", model: "gpt-4.1-mini", source: "live" };
      } catch {
        warning = "Live request failed; showing local simulation / 在线请求失败，已显示本地模拟";
      }
    }
    data.cdv_results = Object.fromEntries(activation.memories.filter(m => m.cdv).map(m => [m.id, m.cdv!]));
    const secrets = configuredSecrets();
    data = redactGeneratedResponse(data, secrets);
    activation.reasons = Object.fromEntries(Object.entries(activation.reasons).map(([id, reason]) => [id, redactSensitiveText(reason, secrets)]));
    activation.memories = activation.memories.map(memory => ({ ...memory,
      cdv: memory.cdv ? { ...memory.cdv, reason: redactSensitiveText(memory.cdv.reason, secrets) } : memory.cdv
    }));
    if (revision !== repositoryRevision(await readPensieveRepository())) {
      return NextResponse.json({ error: "Memories changed; retry / 记忆已变化，请重试" }, { status: 409 });
    }
    return NextResponse.json({ ok: true, data, activation: { ...activation, response: data.answer }, revision, warning,
      meta: { provider: data.provider, model: data.model, mode: data.source } });
  } catch {
    return NextResponse.json({ ok: false, error: "Cannot query memory store / 无法查询记忆库" }, { status: 500 });
  }
}
