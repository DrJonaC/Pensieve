import {
  type DashboardKeyword,
  type DashboardTheme
} from "@/lib/pensieve-dashboard-core";

type KeywordThemePanelProps = {
  keywords: DashboardKeyword[];
  themes: DashboardTheme[];
  expanded: boolean;
};

export function KeywordThemePanel({
  keywords,
  themes,
  expanded
}: KeywordThemePanelProps) {
  const strongestWeight = keywords[0]?.weight ?? 1;

  return (
    <section className="dashboard-panel rounded-[1.45rem] p-4">
      <div>
        <p className="dashboard-kicker">Priority</p>
        <h3 className="dashboard-section-title mt-1">What the system holds prominent</h3>
        <p className="dashboard-subcopy mt-2">
          Weighted keywords and surfaced themes distilled from the current memory field.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {keywords.length > 0 ? (
          keywords.map((item) => {
            const intensity = item.weight / strongestWeight;
            const chipClass =
              intensity > 0.8
                ? "dashboard-chip dashboard-chip--strong"
                : intensity > 0.55
                  ? "dashboard-chip dashboard-chip--medium"
                  : "dashboard-chip";

            return (
              <span key={item.keyword} className={chipClass}>
                {item.keyword}
              </span>
            );
          })
        ) : (
          <p className="dashboard-empty-copy">No priority keywords are currently visible in the active memory field.</p>
        )}
      </div>

      {expanded ? (
        <div className="mt-5">
          <div className="dashboard-accent-line" />
          <div className="mt-4">
            <p className="dashboard-meta-note">Surfaced Themes</p>
            <div className="mt-3 grid gap-2.5">
              {themes.length > 0 ? (
                themes.map((theme) => (
                  <div
                    key={theme.label}
                    className="rounded-[1rem] border border-[rgba(119,156,149,0.18)] bg-white/70 px-3 py-3 text-sm text-slate-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">{theme.label}</span>
                      <span className="dashboard-meta-note">{theme.memory_ids.length} memories</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-[rgba(122,150,144,0.22)] bg-white/58 px-3 py-3">
                  <p className="dashboard-empty-copy">
                    No surfaced themes are available until more visible memories remain in the field.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
