import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/openai";
import { detectCDV, type CDVMemoryUnit, type TPLevel } from "@/lib/cdv";

type QueryBody = {
  query?: unknown;
  memories?: unknown;
  cdv_memories?: unknown;
};

type ValidMemory = {
  id: string;
  content: string;
  relevance_score: number;
  risk_level: string;
  origin_context?: string;
  origin_tp?: TPLevel;
};

function isValidMemoryArray(value: unknown): value is ValidMemory[] {
  return (
    Array.isArray(value) &&
    value.every((memory) => {
      if (!memory || typeof memory !== "object") {
        return false;
      }

      const candidate = memory as {
        id?: unknown;
        content?: unknown;
        relevance_score?: unknown;
        risk_level?: unknown;
        origin_context?: unknown;
        origin_tp?: unknown;
      };

      return (
        typeof candidate.id === "string" &&
        typeof candidate.content === "string" &&
        typeof candidate.relevance_score === "number" &&
        typeof candidate.risk_level === "string" &&
        (candidate.origin_context === undefined || typeof candidate.origin_context === "string") &&
        (candidate.origin_tp === undefined || typeof candidate.origin_tp === "string")
      );
    })
  );
}

function isValidBody(body: QueryBody): body is { query: string; memories: ValidMemory[]; cdv_memories: ValidMemory[] } {
  return (
    typeof body.query === "string" &&
    isValidMemoryArray(body.memories) &&
    isValidMemoryArray(body.cdv_memories)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QueryBody;

    if (!isValidBody(body)) {
      return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 500 });
    }

    const cdvMap = Object.fromEntries(
      body.cdv_memories.map((memory) => {
        const cdvMemory: CDVMemoryUnit = {
          ...memory,
          risk_level: memory.risk_level as CDVMemoryUnit["risk_level"],
          keywords: [],
          created_at: "",
          last_activated: "",
          activation_count: 0,
          status: "active",
          origin_context: memory.origin_context ?? "",
          origin_tp: memory.origin_tp ?? "public"
        };
        return [memory.id, detectCDV(body.query, cdvMemory)];
      })
    );

    const result = await generateResponse({
      query: body.query,
      memories: body.memories
    });

    const memory_explanations = result.memory_explanations.map((explanation) => ({
      ...explanation,
      cdv: cdvMap[explanation.memory_id] ?? null
    }));

    return NextResponse.json({
      ok: true,
      data: {
        answer: result.answer,
        summary: result.summary,
        memory_explanations,
        cdv_results: cdvMap
      },
      meta: {
        provider: "openai",
        model: "gpt-4.1-mini",
        mode: "live"
      }
    });
  } catch (error) {
    console.error("[ROUTE ERROR]", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
