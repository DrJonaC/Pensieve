"use client";

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
  if (!memory) {
    return (
      <section className="dashboard-panel rounded-[1.5rem] p-5">
        <p className="dashboard-empty-copy">Select a memory to inspect its trace and controls.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-panel rounded-[1.5rem] p-5">
      <div className="space-y-2">
        <p className="dashboard-kicker">Memory Inspector</p>
        <h2 className="dashboard-section-title">Trace, storage path, and lightweight controls</h2>
        <p className="dashboard-subcopy">
          This panel reflects the structured memory layer built from captured events, not direct
          parameter memory inside the model.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/76 p-4 shadow-sm">
        <p className={`${compact ? "text-[0.82rem] leading-5" : "text-sm leading-6"} font-semibold text-slate-800`}>{memory.content}</p>
        <div className="mt-3 grid gap-2 text-xs leading-6 text-slate-500">
          <p>Status: {memory.status}</p>
          <p>Pinned: {memory.pinned ? "yes" : "no"}</p>
          <p>Storage path: {memory.storagePath}</p>
          <p>Last activated: {memory.lastActivatedAt ?? "not yet activated"}</p>
          <p>Info type: {memory.metadata?.infoType ?? "unspecified"}</p>
          <p>Origin context: {memory.metadata?.originContext ?? "unspecified"}</p>
        </div>
      </div>

      <div className={`mt-4 flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
        <ActionButton
          label={memory.pinned ? "Unpin" : "Pin"}
          compact={compact}
          onClick={() => onAction({ type: "pin", memoryId: memory.id })}
        />
        <ActionButton
          label={memory.status === "softened" ? "Unsoften" : "Soften"}
          compact={compact}
          onClick={() => onAction({ type: "soften", memoryId: memory.id })}
        />
        <ActionButton
          label={memory.status === "hidden" ? "Restore" : "Hide"}
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
        <p className="dashboard-meta-note">Trace</p>
        <div className="mt-3 grid gap-2 text-xs leading-6 text-slate-500">
          <p>Source event ids: {(trace?.sourceEventIds ?? memory.sourceEventIds).join(", ")}</p>
          <p>Source paths: {(trace?.sourcePaths ?? memory.sourcePaths).join(" | ")}</p>
          <p>
            Extraction note:{" "}
            {trace?.extractionNotes ??
              "Structured from captured events and stored in the local Pensieve memory store."}
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
