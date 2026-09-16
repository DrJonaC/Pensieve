"use client";

import { useLocale } from "@/lib/locale";

type InputBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  modeLabel?: string;
};

export function InputBox({ value, onChange, onSubmit, isLoading = false, modeLabel }: InputBoxProps) {
  const { ui } = useLocale();
  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor="query" className="block text-sm uppercase tracking-[0.24em] text-cyan-100/60">
          {ui("Query")}
        </label>
        {modeLabel ? (
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-50/85">
            {modeLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          id="query"
          value={value}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
          placeholder={ui("Ask something...")}
          className="min-h-14 flex-1 rounded-[1.25rem] border border-white/10 bg-slate-950/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/55 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="rounded-[1.25rem] border border-cyan-300/45 bg-gradient-to-r from-cyan-300 to-blue-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:from-cyan-200 hover:to-blue-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? ui("Consulting the basin...") : ui("Surface Memory")}
        </button>
      </div>
    </div>
  );
}
