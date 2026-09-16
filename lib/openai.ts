import OpenAI from "openai";
import { redactGeneratedResponse, redactSensitiveText } from "./privacy.ts";
import { configuredSecrets } from "./privacy-server.ts";
import { detectCDV, type CDVMemoryUnit, type CDVResult, type TPLevel } from "@/lib/cdv";
type GenerateResponseInput = {
  query: string;
  memories: {
    id: string;
    content: string;
    relevance_score: number;
    risk_level: string;
    origin_context?: string;
    origin_tp?: TPLevel;
  }[];
};

type MemoryExplanation = {
  memory_id: string;
  why: string;
};

type GenerateResponseOutput = {
  answer: string;
  summary: string;
  memory_explanations: MemoryExplanation[];
  cdv_results: Record<string, CDVResult>;
};

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local as OPENAI_API_KEY=your_api_key_here.");
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

function buildCDVMap(query: string, memories: GenerateResponseInput["memories"]): Record<string, CDVResult> {
  return Object.fromEntries(
    memories.map((memory) => {
      const cdvMemory: CDVMemoryUnit = {
        ...memory,
        keywords: [],
        created_at: "",
        last_activated: "",
        activation_count: 0,
        relevance_score: memory.relevance_score,
        risk_level: memory.risk_level as CDVMemoryUnit["risk_level"],
        status: "active",
        origin_context: memory.origin_context ?? "",
        origin_tp: memory.origin_tp ?? "public"
      };
      return [memory.id, detectCDV(query, cdvMemory)];
    })
  );
}

function buildFallbackResponse(
  input: GenerateResponseInput,
  answer: string,
  cdv_results: Record<string, CDVResult>
): GenerateResponseOutput {
  return {
    answer,
    summary:
      input.memories.length > 0
        ? `Most activated memories: ${input.memories
            .slice(0, 3)
            .map((memory) => memory.content)
            .join(" ")}`
        : "No memory summary was available.",
    memory_explanations: input.memories.slice(0, 3).map((memory) => ({
      memory_id: memory.id,
      why: `This memory surfaced because it was included among the highest-ranked memories for the current query.`
    })),
    cdv_results
  };
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

function isStructuredResponse(value: unknown): value is GenerateResponseOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as GenerateResponseOutput;
  return (
    typeof candidate.answer === "string" &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.memory_explanations) &&
    candidate.memory_explanations.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const explanation = item as MemoryExplanation;
      return typeof explanation.memory_id === "string" && typeof explanation.why === "string";
    })
  );
}

export async function generateResponse(input: GenerateResponseInput): Promise<GenerateResponseOutput> {
  const secrets = configuredSecrets();
  const safeInput = {
    ...input,
    query: redactSensitiveText(input.query, secrets),
    memories: input.memories.slice(0, 3).map((memory, index) => ({
      ...memory,
      id: `memory-${index + 1}`,
      content: redactSensitiveText(memory.content, secrets),
      origin_context: memory.origin_context ? redactSensitiveText(memory.origin_context, secrets) : undefined
    }))
  };
  const result = await generateUnfilteredResponse(safeInput);
  return redactGeneratedResponse({
    ...result,
    memory_explanations: result.memory_explanations.flatMap(item => {
      const index = safeInput.memories.findIndex(memory => memory.id === item.memory_id);
      return index < 0 ? [] : [{ ...item, memory_id: input.memories[index].id }];
    }),
    cdv_results: Object.fromEntries(Object.entries(result.cdv_results).flatMap(([id, value]) => {
      const index = safeInput.memories.findIndex(memory => memory.id === id);
      return index < 0 ? [] : [[input.memories[index].id, value]];
    }))
  }, secrets);
}

async function generateUnfilteredResponse(input: GenerateResponseInput): Promise<GenerateResponseOutput> {
  const cdv_results = buildCDVMap(input.query, input.memories);

  const client = getClient();
  const topMemories = input.memories.slice(0, 3);
  const memoryBlock = topMemories.length
    ? topMemories
        .map(
          (memory, index) =>
            `${index + 1}. [${memory.id}] ${memory.content} | relevance=${memory.relevance_score} | risk=${memory.risk_level}`
        )
        .join("\n")
    : "No memories were provided.";

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "You are helping a memory observability product answer a user query.",
              "Use the query and provided memories only.",
              "Do not hallucinate personal data that is not explicitly provided.",
              "Never output credentials. Preserve [REDACTED:...] markers and do not infer their hidden values.",
              "Return valid JSON only.",
              'Format: {"answer":"string","summary":"string","memory_explanations":[{"memory_id":"string","why":"string"}]}.',
              "The answer should be 2-3 concise sentences.",
              "The summary should briefly describe the most activated memories.",
              "Include one explanation for each provided memory."
            ].join(" ")
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Query:\n${input.query}\n\nTop memories:\n${memoryBlock}`
          }
        ]
      }
    ]
  });

  const outputText = response.output_text?.trim();
  if (!outputText) {
    throw new Error("OpenAI returned an empty answer.");
  }

  const jsonText = extractJsonObject(outputText);
  if (!jsonText) {
    return buildFallbackResponse(input, outputText, cdv_results);
  }

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (isStructuredResponse(parsed)) {
      const fallback = buildFallbackResponse(input, outputText, cdv_results);
      return {
        answer: parsed.answer.trim() || fallback.answer,
        summary: parsed.summary.trim() || fallback.summary,
        memory_explanations: parsed.memory_explanations,
        cdv_results
      };
    }
  } catch {
    return buildFallbackResponse(input, outputText, cdv_results);
  }

  return buildFallbackResponse(input, outputText, cdv_results);
}
