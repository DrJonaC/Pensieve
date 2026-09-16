"use client";

import { useLocale } from "@/lib/locale";
import { localizeRelativeTime } from "@/lib/ui-copy";
import { type CDVResult } from "@/lib/cdv";
import { ScoredMemory } from "@/lib/memory";
import { presentQueryMemoryItem } from "@/lib/pensieve-memory-item-presenter";

type MemoryCardProps = {
  memory: ScoredMemory;
  explanation: string;
  cdv?: CDVResult;
  onSoften: (id: string) => void;
  onForget: (id: string) => void;
  onPin: (id: string) => void;
  priorityIndex?: number;
};

const riskStyles: Record<ScoredMemory["risk_level"], string> = {
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  high: "border-rose-400/30 bg-rose-400/10 text-rose-200"
};

export function MemoryCard({
  memory,
  explanation,
  cdv,
  onSoften,
  onForget,
  onPin,
  priorityIndex
}: MemoryCardProps) {
  const { ui, t, language } = useLocale();
  const presented = presentQueryMemoryItem({
    memory,
    explanation,
    priorityIndex,
    cdv
  });
  const showCDVBadge = cdv?.is_violation === true;

  return (
    <article className="rounded-[1.7rem] border border-cyan-300/12 bg-slate-950/55 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/26 hover:shadow-[0_18px_40px_rgba(3,8,20,0.26)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {presented.priorityLabel ? (
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/[0.12] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-50">
                {t(`Priority ${priorityIndex}`, `优先级 ${priorityIndex}`)}
              </span>
            ) : null}
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">{ui(presented.statusLabel)}</p>
            {presented.pinned ? (
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                {ui("Pinned")}
              </span>
            ) : null}
            {showCDVBadge && cdv?.severity === "warning" ? (
              <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-[11px] font-medium text-orange-300">
                {ui("Context Drift")}
              </span>
            ) : null}
            {showCDVBadge && cdv?.severity === "critical" ? (
              <span className="rounded-full border border-rose-400/50 bg-rose-400/20 px-2.5 py-1 text-[11px] font-medium text-rose-200">
                {ui("CDV Violation")}
              </span>
            ) : null}
            {cdv && !cdv.is_violation ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                {ui("CDV Clean")}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-2xl font-semibold leading-8 text-white">{presented.title}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${riskStyles[memory.risk_level]}`}>
          {ui(presented.riskLabel)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {presented.keywords.map((keyword) => (
          <span
            key={`${memory.id}-${keyword}`}
            className="rounded-full border border-cyan-300/14 bg-cyan-300/[0.06] px-3 py-1 text-xs text-cyan-50/85"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>{ui("Influence")}</span>
          <span>{presented.scorePercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-900">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-300"
            style={{ width: `${presented.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/60">{ui("Why It Surfaced")}</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">{presented.explanation}</p>
      </div>

      {showCDVBadge ? (
        <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/60">{ui("Context Drift Analysis")}</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{presented.cdvReason}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">{ui("Influence")}</p>
          <p className="mt-2 text-white">{presented.scorePercent}%</p>
        </div>
        <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">{ui("Last Activated")}</p>
          <p className="mt-2 text-white">{localizeRelativeTime(language, presented.lastActivatedLabel)}</p>
        </div>
        <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">{ui("Activation Count")}</p>
          <p className="mt-2 text-white">{presented.activationCount}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSoften(memory.id)}
          className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
        >
          {memory.status === "softened" ? ui("Unsoften") : ui("Soften")}
        </button>
        <button
          type="button"
          onClick={() => onForget(memory.id)}
          className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-400/20"
        >
          {ui("Hide")}
        </button>
        <button
          type="button"
          onClick={() => onPin(memory.id)}
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:border-cyan-300/55 hover:bg-cyan-300/20"
        >
          {memory.pinned ? ui("Unpin") : ui("Pin")}
        </button>
      </div>
    </article>
  );
}
