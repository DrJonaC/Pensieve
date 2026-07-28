"use client";

import { Heatmap } from "@/components/Heatmap";
import { MemoryCard } from "@/components/MemoryCard";
import { PriorityPortraitPanel } from "@/components/PriorityPortraitPanel";
import { QueryPanel } from "@/components/QueryPanel";
import { RequestTracePanel } from "@/components/RequestTracePanel";
import { presentQueryMemoryItem } from "@/lib/pensieve-memory-item-presenter";
import { presentQueryPriorityPortrait } from "@/lib/pensieve-priority-portrait";
import { presentRequestTrace } from "@/lib/pensieve-request-trace";
import { usePensieve } from "@/lib/session";
import { derivePensieveQueryView } from "@/lib/pensieve-query-view";

export function SurfaceModelPanel() {
  const {
    mode,
    session,
    narrative,
    displayedReasons,
    submission,
    isLoading,
    error,
    setMode,
    setQuery,
    submitQuery,
    togglePinnedMemory,
    toggleSoftenedMemory,
    forgetMemory,
    restoreForgotten,
    resetView,
    undo
  } = usePensieve();
  const view = derivePensieveQueryView({
    query: session.query,
    result: session.result,
    isLoading,
    error
  });
  const portrait = presentQueryPriorityPortrait(view);
  const trace = presentRequestTrace(submission);

  return (
    <main className="space-y-6">
      <QueryPanel
        query={session.query}
        mode={mode}
        status={view.status}
        isLoading={isLoading}
        canUndo={session.history.length > 0}
        error={error}
        submission={submission}
        onQueryChange={setQuery}
        onSubmit={() => void submitQuery()}
        onModeChange={setMode}
        onResetView={resetView}
        onRestoreForgotten={restoreForgotten}
        onUndo={undo}
      />

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Response Layer</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Answer and memory summary</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">{narrative.answer}</p>

          <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/60">Memory Summary</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{narrative.summary}</p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: "Provider", value: narrative.provider },
              { label: "Narrative Source", value: narrative.source },
              { label: "Model", value: narrative.model }
            ].map((item) => (
              <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-slate-950/40 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">{item.label}</p>
                <p className="mt-2 text-sm text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Activated Field</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Which memories are currently in play</h2>
          <div className="mt-4 space-y-3">
            {view.activatedMemories.length > 0 ? (
              view.activatedMemories.map((memory, index) => {
                const presented = presentQueryMemoryItem({
                  memory,
                  explanation:
                    displayedReasons[memory.id] ?? session.result.reasons[memory.id] ?? "This trace remained active.",
                  priorityIndex: index + 1,
                  cdv: memory.cdv ?? undefined
                });

                return (
                <div key={memory.id} className="rounded-[1.3rem] border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {presented.priorityLabel ? (
                        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">{presented.priorityLabel}</p>
                      ) : null}
                      <p className="mt-1 text-sm leading-7 text-white">{presented.title}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">
                      {presented.scorePercent}%
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {presented.keywords.slice(0, 4).map((keyword) => (
                      <span
                        key={`${presented.id}-${keyword}`}
                        className="rounded-full border border-cyan-300/14 bg-cyan-300/[0.06] px-2.5 py-1 text-[11px] text-cyan-50/85"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    {presented.explanation}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    <span>{presented.statusLabel}</span>
                    <span>{presented.lastActivatedLabel}</span>
                    <span>{presented.activationCount} activations</span>
                  </div>
                </div>
              );
              })
            ) : (
              <div className="rounded-[1.3rem] border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-400">
                {session.query.trim()
                  ? "No strong memory match surfaced for the current query."
                  : "The field is currently dormant. Submit a query to activate retrieval."}
              </div>
            )}
          </div>
        </div>
      </section>

      <RequestTracePanel trace={trace} />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Heatmap
          tokens={session.result.tokens}
          memories={session.result.memories}
          heatmap={session.result.heatmap}
        />

        <PriorityPortraitPanel
          portrait={portrait}
          title="Current activation hierarchy"
          subtitle="The same retrieval pass produces both the observability surface and the human-readable priority portrait."
        />
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Memory Detail</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Detailed activated memories</h2>
          </div>
          <p className="text-sm text-slate-400">{view.visibleMemories.length} visible memories</p>
        </div>

        <div className="mt-5 space-y-4">
          {view.visibleMemories.slice(0, 3).map((memory, index) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              explanation={
                displayedReasons[memory.id] ??
                session.result.reasons[memory.id] ??
                "This memory stayed available in the current field."
              }
              cdv={memory.cdv ?? undefined}
              priorityIndex={index + 1}
              onSoften={toggleSoftenedMemory}
              onForget={forgetMemory}
              onPin={togglePinnedMemory}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
