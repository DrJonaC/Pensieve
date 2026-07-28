"use client";

export function GuidePanel() {
  const sections = [
    {
      title: "What Pensieve is",
      body:
        "Pensieve is a memory observability and governance layer. It helps users inspect what structured memory the system holds, why it matters, and how lightweight actions may change future retrieval."
    },
    {
      title: "What a memory unit means",
      body:
        "A memory unit is a structured semantic record. It carries content, keywords, relevance, risk, timestamps, activation counts, and governance state rather than being treated as an opaque block of text."
    },
    {
      title: "How relevance is computed",
      body:
        "In the current query-based mode, the app tokenizes the query, retrieves from the memory-RAG store, reranks by similarity plus governance modifiers, and then surfaces the highest-weight memories."
    },
    {
      title: "What governance actions mean",
      body:
        "Pin raises prominence, soften lowers prominence, hide suppresses active retrieval without destructive deletion, restore returns a hidden memory to the visible field, and undo reverts the latest local action."
    }
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-300/12 bg-slate-950/55 p-6 shadow-[0_24px_60px_rgba(3,8,20,0.34)] backdrop-blur md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Guide</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">How to read Pensieve</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
          The current system combines a query-based memory-RAG interaction surface with a governance-aware memory
          portrait. The heatmap and activation logic are retrieval-facing; the dashboard and actions are user-facing.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/60">{section.title}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Current Boundaries</p>
        <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
          <p>The current heatmap and activation surface are deterministic local simulations layered on top of memory-RAG retrieval.</p>
          <p>Live mode swaps the response narrative for a server-side OpenAI call, but keeps retrieval, ranking, and governance on the local product side.</p>
          <p>The architecture is intentionally prepared for a future query-free dashboard and host-agnostic provider/plugin route.</p>
        </div>
      </section>
    </main>
  );
}
