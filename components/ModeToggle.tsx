"use client";

import { useLocale } from "@/lib/locale";

import { type PensieveMode } from "@/lib/query";

type ModeToggleProps = {
  mode: PensieveMode;
  onChange: (mode: PensieveMode) => void;
  disabled?: boolean;
};

export function ModeToggle({ mode, onChange, disabled = false }: ModeToggleProps) {
  const { ui } = useLocale();
  return (
    <div className="inline-flex rounded-full border border-cyan-400/20 bg-slate-950/50 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      {(["mock", "live"] as const).map((value) => {
        const active = mode === value;

        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value)}
            className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-[0.2em] transition ${
              active
                ? "bg-cyan-300 text-slate-950"
                : "text-cyan-100/75 hover:bg-white/5 hover:text-cyan-50"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {value === "mock" ? ui("Mock Mode") : ui("Live Mode")}
          </button>
        );
      })}
    </div>
  );
}
