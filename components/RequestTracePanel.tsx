"use client";

import { type RequestTraceModel } from "@/lib/pensieve-request-trace";

type RequestTracePanelProps = {
  trace: RequestTraceModel;
};

export function RequestTracePanel({ trace }: RequestTracePanelProps) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">Request Trace</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">How the latest submission moved through the system</h2>
        </div>
        <span className="rounded-full border border-cyan-300/18 bg-cyan-300/8 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100/75">
          {trace.statusLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trace.cards.map((item) => (
          <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-slate-950/40 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">{item.label}</p>
            <p className="mt-2 text-sm leading-7 text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
