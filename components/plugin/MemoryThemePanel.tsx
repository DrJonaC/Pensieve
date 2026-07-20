import type { MemorySnapshot } from "@/lib/plugin-types";

type MemoryThemePanelProps = {
  snapshot: MemorySnapshot | null;
  compact?: boolean;
};

function toneForWeight(weight: number): string {
  if (weight >= 0.9) {
    return "dashboard-chip dashboard-chip--strong";
  }

  if (weight >= 0.55) {
    return "dashboard-chip dashboard-chip--medium";
  }

  return "dashboard-chip";
}

export function MemoryThemePanel({ snapshot, compact = false }: MemoryThemePanelProps) {
  return (
    <section className={`grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
      <div className="dashboard-panel rounded-[1.5rem] p-5">
        <div className="space-y-2">
          <p className="dashboard-kicker">Priority Keywords</p>
          <h2 className="dashboard-section-title">What the memory field weights most</h2>
          <p className="dashboard-subcopy">
            Weighted from visible structured memories rather than direct LLM parameter state.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {snapshot?.topKeywords.length ? (
            snapshot.topKeywords.map((entry) => (
              <span key={entry.keyword} className={toneForWeight(entry.weight)}>
                {entry.keyword}
              </span>
            ))
          ) : (
            <p className="dashboard-empty-copy">No visible keyword priorities yet.</p>
          )}
        </div>
      </div>

      <div className="dashboard-panel rounded-[1.5rem] p-5">
        <div className="space-y-2">
          <p className="dashboard-kicker">Surfaced Themes</p>
          <h2 className="dashboard-section-title">How those memories cluster conceptually</h2>
          <p className="dashboard-subcopy">
            Themes are derived locally from structured memory content and keywords.
          </p>
        </div>
        <div className={`mt-4 ${compact ? "space-y-2.5" : "space-y-3"}`}>
          {snapshot?.topThemes.length ? (
            snapshot.topThemes.map((theme) => (
              <div
                key={theme.label}
                className="rounded-2xl border border-slate-200/70 bg-white/72 px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">{theme.label}</p>
                  <span className="dashboard-status-pill">{theme.memoryIds.length} memories</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Weighted signal: {theme.weight.toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <p className="dashboard-empty-copy">No visible themes yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
