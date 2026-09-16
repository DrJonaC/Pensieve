"use client";

import { useLocale } from "@/lib/locale";

import { type PriorityPortrait } from "@/lib/pensieve-priority-portrait";

type PriorityPortraitPanelProps = {
  portrait: PriorityPortrait;
  title?: string;
  subtitle?: string;
  showBuckets?: boolean;
};

function getChipClass(tone: PriorityPortrait["keywords"][number]["tone"]): string {
  switch (tone) {
    case "strong":
      return "border border-cyan-300/30 bg-cyan-300/12 text-cyan-50";
    case "medium":
      return "border border-cyan-200/15 bg-cyan-200/8 text-cyan-100";
    default:
      return "border border-white/10 bg-white/5 text-slate-200";
  }
}

export function PriorityPortraitPanel({
  portrait,
  title = "Priority Portrait",
  subtitle = "Weighted keywords and surfaced themes distilled from the current memory field.",
  showBuckets = false
}: PriorityPortraitPanelProps) {
  const { ui } = useLocale();
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">{ui("Priority Portrait")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{ui(title)}</h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-400">{ui(subtitle)}</p>
      </div>

      {showBuckets ? (
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {portrait.buckets.map((item) => (
            <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/60">{ui(item.label)}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`grid gap-4 ${showBuckets ? "mt-5 lg:grid-cols-[0.95fr_1.05fr]" : "mt-5 lg:grid-cols-[1fr_1fr]"}`}>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">{ui("Priority Keywords")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {portrait.keywords.length > 0 ? (
              portrait.keywords.map((keyword) => (
                <span
                  key={keyword.keyword}
                  className={`rounded-full px-3 py-1.5 text-sm ${getChipClass(keyword.tone)}`}
                >
                  {keyword.keyword}
                </span>
              ))
            ) : (
              <p className="text-sm leading-7 text-slate-400">
                {ui("Priority keywords will appear after the memory field becomes active.")}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">{ui("Surfaced Themes")}</p>
          <div className="mt-4 grid gap-3">
            {portrait.themes.length > 0 ? (
              portrait.themes.map((theme) => (
                <div key={theme.label} className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{theme.label}</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/60">
                      {theme.memoryCount} {ui("memories")} </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-slate-400">
                {ui("Themes will emerge when visible memories remain in the active field.")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
