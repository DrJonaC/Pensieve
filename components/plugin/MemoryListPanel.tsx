import type { StructuredMemoryRecord } from "@/lib/plugin-types";

type MemoryListPanelProps = {
  memories: StructuredMemoryRecord[];
  selectedMemoryId: string | null;
  compact?: boolean;
  onSelect: (memoryId: string) => void;
};

function riskTone(riskLevel: StructuredMemoryRecord["riskLevel"]): string {
  if (riskLevel === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (riskLevel === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function MemoryListPanel({
  memories,
  selectedMemoryId,
  compact = false,
  onSelect
}: MemoryListPanelProps) {
  return (
    <section className="dashboard-panel rounded-[1.5rem] p-5">
      <div className="space-y-2">
        <p className="dashboard-kicker">Memory List</p>
        <h2 className="dashboard-section-title">Structured memories available for review</h2>
        <p className="dashboard-subcopy">
          Select a memory to inspect its path, trace, metadata, and light governance controls.
        </p>
      </div>

      <div className={`mt-4 ${compact ? "space-y-2.5" : "space-y-3"}`}>
        {memories.map((memory) => {
          const isSelected = selectedMemoryId === memory.id;
          return (
            <button
              key={memory.id}
              type="button"
              onClick={() => onSelect(memory.id)}
              className={`w-full rounded-[1.35rem] border px-4 ${compact ? "py-3.5" : "py-4"} text-left transition ${
                isSelected
                  ? "border-slate-400 bg-white shadow-md"
                  : "border-slate-200/70 bg-white/72 shadow-sm hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="dashboard-status-pill">{memory.status}</span>
                {memory.pinned ? <span className="dashboard-status-pill">Pinned</span> : null}
                <span
                  className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-medium ${riskTone(memory.riskLevel)}`}
                >
                  {memory.riskLevel} risk
                </span>
              </div>

              <p className={`mt-3 font-semibold text-slate-800 ${compact ? "text-[0.82rem] leading-5" : "text-sm leading-6"}`}>{memory.content}</p>

              <div className={`mt-3 flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
                {memory.keywords.slice(0, 5).map((keyword) => (
                  <span key={keyword} className="dashboard-chip">
                    {keyword}
                  </span>
                ))}
              </div>

              <div className={`mt-3 grid gap-2 text-xs text-slate-500 ${compact ? "grid-cols-1" : "sm:grid-cols-3"}`}>
                <p>Importance: {memory.importance.toFixed(2)}</p>
                <p>Activations: {memory.activationCount}</p>
                <p className="break-all">Store: {memory.storagePath}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
