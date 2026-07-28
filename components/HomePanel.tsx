"use client";

import Link from "next/link";
import { usePensieve } from "@/lib/session";
import { derivePensieveQueryView } from "@/lib/pensieve-query-view";

export function HomePanel() {
  const { mode, session, narrative, isLoading, error } = usePensieve();
  const view = derivePensieveQueryView({
    query: session.query,
    result: session.result,
    isLoading,
    error
  });
  const releaseNotes = [
    "Shared priority portrait across the routed app and the dashboard/plugin route.",
    "Live request trace with submit time, settle time, response source, latency, and stale-response protection.",
    "Shared memory-item presenter so cards and ranked lists now describe memory state more consistently."
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-300/12 bg-slate-950/55 p-6 shadow-[0_24px_60px_rgba(3,8,20,0.34)] backdrop-blur md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Pensieve / 冥想盆</p>
          <span className="rounded-full border border-cyan-300/18 bg-cyan-300/8 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100/75">
            v0.2 update
          </span>
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Observe how memory shapes an answer, then govern what remains prominent.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
          Pensieve turns LLM memory from a hidden retrieval substrate into a visible, explainable, and reversible
          control surface. The current build supports query-based memory-RAG today and preserves a clean path toward a
          query-free dashboard or host-agnostic plugin shell.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/surface-model"
            className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
          >
            Open Surface Model
          </Link>
          <Link
            href="/user-view"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:border-cyan-300/20 hover:bg-white/10"
          >
            Open User View
          </Link>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-cyan-300/12 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Version Update</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">What changed in this build</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            This release pushes Pensieve further beyond demo mode and makes the query-based memory observability flow
            feel more coherent, reusable, and ready for hands-on testing.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {releaseNotes.map((note, index) => (
            <div key={note} className="rounded-[1.35rem] border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                  0{index + 1}
                </span>
                <p className="text-sm leading-7 text-slate-300">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Mode", value: mode === "mock" ? "Mock" : "Live" },
          { label: "Visible Memories", value: String(view.visibleMemories.length) },
          { label: "Pinned / Softened", value: `${view.bucketSummary.pinned} / ${view.bucketSummary.softened}` },
          { label: "Hidden", value: String(view.bucketSummary.hidden) }
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/60">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Current System Read</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">What the session currently emphasizes</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{narrative.summary}</p>
          <p className="mt-4 text-sm leading-7 text-slate-400">Last answer preview: {narrative.answer}</p>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Page Roles</p>
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
            <p><span className="text-white">Home</span>: product overview and session status.</p>
            <p><span className="text-white">Guide</span>: mental model for memory, retrieval, and governance.</p>
            <p><span className="text-white">User View</span>: memory portrait and human-readable priority.</p>
            <p><span className="text-white">Surface Model</span>: query, answer, activation list, and heatmap.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
