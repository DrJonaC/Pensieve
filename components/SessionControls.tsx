"use client";

import { useLocale } from "@/lib/locale";

type SessionControlsProps = {
  canUndo: boolean;
  onResetView: () => void;
  onRestoreForgotten: () => void;
  onUndo: () => void;
};

export function SessionControls({
  canUndo,
  onResetView,
  onRestoreForgotten,
  onUndo
}: SessionControlsProps) {
  const { ui } = useLocale();
  const buttonClass =
    "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-200 transition hover:border-cyan-300/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onResetView} className={buttonClass}>
        {ui("Reset View")}
      </button>
      <button type="button" onClick={onRestoreForgotten} className={buttonClass}>
        {ui("Restore Hidden")}
      </button>
      <button type="button" onClick={onUndo} className={buttonClass} disabled={!canUndo}>
        {ui("Undo")}
      </button>
    </div>
  );
}
