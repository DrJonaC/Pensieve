"use client";

import { useLocale } from "@/lib/locale";

import { MemoryCard } from "@/components/MemoryCard";
import { PriorityPortraitPanel } from "@/components/PriorityPortraitPanel";
import { presentQueryPriorityPortrait } from "@/lib/pensieve-priority-portrait";
import { usePensieve } from "@/lib/session";
import { derivePensieveQueryView } from "@/lib/pensieve-query-view";

export function UserViewPanel() {
  const { ui } = useLocale();
  const {
    session,
    narrative,
    displayedReasons,
    isLoading,
    error,
    togglePinnedMemory,
    toggleSoftenedMemory,
    forgetMemory
  } = usePensieve();
  const view = derivePensieveQueryView({
    query: session.query,
    result: session.result,
    isLoading,
    error
  });
  const portrait = presentQueryPriorityPortrait(view);

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-300/12 bg-slate-950/55 p-6 shadow-[0_24px_60px_rgba(3,8,20,0.34)] backdrop-blur md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{ui("User View")}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{ui("Current memory portrait")}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
          {ui("This page compresses the memory field into a human-readable priority portrait: top keywords, surfaced themes, state buckets, and the memory units most likely to influence the current response.")}
        </p>
      </section>

      <PriorityPortraitPanel
        portrait={portrait}
        title={ui("Current memory hierarchy")}
        subtitle={ui("A compact portrait of which memory fragments, themes, and state buckets currently dominate the field.")}
        showBuckets
      />

      <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">{ui("Memory Units")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{ui("What the model currently remembers most")}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            {view.hasStrongMatch
              ? narrative.summary
              : ui("No strong memory match is active right now. The field is visible, but nothing is especially dominant for the current query.")}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {view.visibleMemories.length > 0 ? (
            view.visibleMemories.map((memory, index) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                explanation={
                  displayedReasons[memory.id] ??
                  session.result.reasons[memory.id] ??
                  ui("This memory stayed available in the current field.")
                }
                cdv={memory.cdv ?? undefined}
                priorityIndex={index + 1}
                onSoften={toggleSoftenedMemory}
                onForget={forgetMemory}
                onPin={togglePinnedMemory}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5 text-sm leading-7 text-slate-400">
              {ui("No visible memories remain. Restore hidden memories or submit a new query to repopulate the field.")}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
