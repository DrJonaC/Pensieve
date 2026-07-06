import { ScoredMemory, getRelativeTime } from "@/lib/memory";
import { type CDVResult } from "@/lib/cdv";

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
  const showCDVBadge = cdv?.is_violation === true;
  return (
    <article className="mystic-panel rounded-[1.9rem] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[0_0_36px_rgba(212,175,55,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {priorityIndex ? (
              <span className="rounded-full border border-gold/30 bg-gold/[0.08] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
                Priority {priorityIndex}
              </span>
            ) : null}
            <p className="text-xs uppercase tracking-[0.24em] text-mist/70">{memory.status}</p>
            {memory.pinned ? (
              <span className="rounded-full border border-gold/35 bg-gold/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
                Pinned
              </span>
            ) : null}
            {showCDVBadge && cdv.severity === "warning" ? (
              <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-[11px] font-medium text-orange-300">
                ⚠ Context Drift
              </span>
            ) : null}
            {showCDVBadge && cdv.severity === "critical" ? (
              <span className="rounded-full border border-rose-400/50 bg-rose-400/20 px-2.5 py-1 text-[11px] font-medium text-rose-200">
                🚨 CDV Violation
              </span>
            ) : null}
            {cdv && !cdv.is_violation ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                ✓ CDV Clean
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-8 text-white">{memory.content}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${riskStyles[memory.risk_level]}`}>
          {memory.risk_level} risk
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {memory.keywords.map((keyword) => (
          <span
            key={`${memory.id}-${keyword}`}
            className="rounded-full border border-gold/15 bg-gold/[0.04] px-3 py-1 text-xs text-mist"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-mist/75">
          <span>Influence</span>
          <span>{Math.round(memory.relevance_score * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-black-card">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-gold-dark to-gold-light"
            style={{ width: `${Math.max(memory.relevance_score * 100, 6)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-gold/15 bg-black-card/60 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold/70">Why This Memory Surfaced</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">{explanation}</p>
      </div>

      {showCDVBadge ? (
        <div className="mt-3 rounded-[1.35rem] border border-gold/15 bg-black-card/60 p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold/70">Context Drift Analysis</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{cdv.reason}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div className="rounded-[1.1rem] border border-gold/15 bg-black-card/60 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-mist/70">Influence</p>
          <p className="mt-2 text-white">{Math.round(memory.relevance_score * 100)}%</p>
        </div>
        <div className="rounded-[1.1rem] border border-gold/15 bg-black-card/60 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-mist/70">Last Activated</p>
          <p className="mt-2 text-white">{getRelativeTime(memory.last_activated)}</p>
        </div>
        <div className="rounded-[1.1rem] border border-gold/15 bg-black-card/60 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-mist/70">Activation Count</p>
          <p className="mt-2 text-white">{memory.activation_count}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSoften(memory.id)}
          className="rounded-full border border-gold/20 bg-gold/[0.05] px-3 py-2 text-xs text-white transition hover:border-gold/40 hover:bg-gold/10"
        >
          {memory.status === "softened" ? "Unsoften" : "Soften"}
        </button>
        <button
          type="button"
          onClick={() => onForget(memory.id)}
          className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-400/20"
        >
          Forget
        </button>
        <button
          type="button"
          onClick={() => onPin(memory.id)}
          className="rounded-full border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold transition hover:border-gold/55 hover:bg-gold/20"
        >
          {memory.pinned ? "Unpin" : "Pin"}
        </button>
      </div>
    </article>
  );
}
