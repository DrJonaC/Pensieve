"use client";

import { useLocale } from "@/lib/locale";
import { HeatmapCell, ScoredMemory } from "@/lib/memory";

type HeatmapProps = {
  tokens: string[];
  memories: ScoredMemory[];
  heatmap: HeatmapCell[];
};

function getCellScore(heatmap: HeatmapCell[], token: string, memoryId: string): number {
  return heatmap.find((cell) => cell.token === token && cell.memoryId === memoryId)?.score ?? 0;
}

function getCellColor(score: number): string {
  if (score >= 0.9) return "bg-cyan-300/75";
  if (score >= 0.6) return "bg-cyan-300/45";
  if (score >= 0.3) return "bg-cyan-300/22";
  if (score > 0) return "bg-slate-900";
  return "bg-slate-950";
}

export function Heatmap({ tokens, memories, heatmap }: HeatmapProps) {
  const { ui, t } = useLocale();
  if (tokens.length === 0 || memories.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-cyan-300/12 bg-slate-950/55 p-6">
        <p className="text-sm text-slate-300">{ui("Submit a query to render token-to-memory influence.")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.8rem] border border-cyan-300/12 bg-slate-950/55 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">{ui("Model View")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{ui("Influence Heatmap")}</h2>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>{ui("Columns: input tokens")}</p>
          <p>{ui("Rows: memory units")}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/30 p-3">
        <div
          className="grid min-w-max gap-2"
          style={{ gridTemplateColumns: `220px repeat(${tokens.length}, minmax(54px, 1fr))` }}
        >
          <div />
          {tokens.map((token) => (
            <div
              key={token}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center text-xs text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              {token}
            </div>
          ))}

          {memories.map((memory) => (
            <div key={memory.id} className="contents">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 text-sm leading-6 text-slate-200">
                {memory.content}
              </div>
              {tokens.map((token) => {
                const score = getCellScore(heatmap, token, memory.id);
                return (
                  <div
                    key={`${memory.id}-${token}`}
                    title={t(`Token "${token}" activates Memory "${memory.content}" with score ${score.toFixed(2)}`, `词语「${token}」对记忆「${memory.content}」的模拟激活分数为 ${score.toFixed(2)}`)}
                    className={`flex aspect-square items-center justify-center rounded-2xl border border-white/10 text-[11px] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${getCellColor(score)}`}
                  >
                    {score.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
