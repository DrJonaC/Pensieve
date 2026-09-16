"use client";

import { useLocale } from "@/lib/locale";

import type {
  MemoryAction,
  MemoryTrace,
  StructuredMemoryRecord
} from "@/lib/plugin-types";

type MemoryInspectorPanelProps = {
  memory: StructuredMemoryRecord | null;
  trace: MemoryTrace | null;
  compact?: boolean;
  onAction: (action: MemoryAction) => Promise<void>;
};

export function MemoryInspectorPanel({
  memory,
  trace,
  compact = false,
  onAction
}: MemoryInspectorPanelProps) {
  const { ui, t } = useLocale();
  if (!memory) {
    return (
      <section className="dashboard-panel rounded-[1.5rem] p-5">
        <p className="dashboard-empty-copy">{ui("Select a memory to inspect its trace and controls.")}</p>
      </section>
    );
  }

  return (
    <section className="dashboard-panel rounded-[1.5rem] p-5">
      <div className="space-y-2">
        <p className="dashboard-kicker">{ui("Memory Inspector")}</p>
        <h2 className="dashboard-section-title">{ui("Trace, storage path, and lightweight controls")}</h2>
        <p className="dashboard-subcopy">
          {ui("This panel reflects the structured memory layer built from captured events, not direct parameter memory inside the model.")}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/76 p-4 shadow-sm">
        <p className={`${compact ? "text-[0.82rem] leading-5" : "text-sm leading-6"} font-semibold text-slate-800`}>{memory.content}</p>
        <div className="mt-3 grid gap-2 text-xs leading-6 text-slate-500">
          <p>{ui("Status:")} {ui(memory.status)}</p>
          <p>{ui("Pinned:")} {memory.pinned ? ui("yes") : ui("no")}</p>
          <p>{ui("Storage path:")} {memory.storagePath}</p>
          <p>{ui("Last activated:")} {memory.lastActivatedAt ?? ui("not yet activated")}</p>
          <p>{ui("Info type:")} {ui(memory.metadata?.infoType ?? "unspecified")}</p>
          <p>{ui("Origin context:")} {memory.metadata?.originContext ?? ui("unspecified")}</p>
        </div>
      </div>

      <div className={`mt-4 flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
        <ActionButton
          label={memory.pinned ? ui("Unpin") : ui("Pin")}
          compact={compact}
          onClick={() => onAction({ type: "pin", memoryId: memory.id })}
        />
        <ActionButton
          label={memory.status === "softened" ? ui("Unsoften") : ui("Soften")}
          compact={compact}
          onClick={() => onAction({ type: "soften", memoryId: memory.id })}
        />
        <ActionButton
          label={memory.status === "hidden" ? ui("Restore") : ui("Hide")}
          compact={compact}
          onClick={() =>
            onAction({
              type: memory.status === "hidden" ? "restore" : "hide",
              memoryId: memory.id
            })
          }
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/76 p-4 shadow-sm">
        <p className="dashboard-meta-note">{ui("Trace")}</p>
        <div className="mt-3 grid gap-2 text-xs leading-6 text-slate-500">
          <p>{ui("Source event ids:")} {(trace?.sourceEventIds ?? memory.sourceEventIds).join(", ")}</p>
          <p>{ui("Source paths:")} {(trace?.sourcePaths ?? memory.sourcePaths).join(" | ")}</p>
          <p>
            {ui("Extraction note:")}{" "}
            {trace?.extractionNotes ??
              t("Stored in the local Pensieve memory store.", "保存在 Pensieve 本地记忆库中。")}
          </p>
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  label,
  compact,
  onClick
}: {
  label: string;
  compact?: boolean;
  onClick: () => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${compact ? "px-3 py-1.5" : "px-4 py-2"}`}
    >
      {label}
    </button>
  );
}
