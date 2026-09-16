"use client";

import { useLocale } from "@/lib/locale";
import {
  type DashboardKeyword,
  type DashboardTheme
} from "@/lib/pensieve-dashboard-core";
import { presentDashboardPriorityPortrait } from "@/lib/pensieve-priority-portrait";

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
  const { ui } = useLocale();
  const portrait = presentDashboardPriorityPortrait({
    visible_memories: [],
    hidden_memories: [],
    top_keywords: keywords,
    surfaced_themes: themes,
    buckets: {
      active: [],
      pinned: [],
      softened: [],
      hidden: []
    }
  });

  return (
    <section className="dashboard-panel rounded-[1.45rem] p-4">
      <div>
        <p className="dashboard-kicker">{ui("Priority")}</p>
        <h3 className="dashboard-section-title mt-1">{ui("What the system holds prominent")}</h3>
        <p className="dashboard-subcopy mt-2">
          {ui("Weighted keywords and surfaced themes distilled from the current memory field.")}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {portrait.keywords.length > 0 ? (
          portrait.keywords.map((item) => {
            const chipClass =
              item.tone === "strong"
                ? "dashboard-chip dashboard-chip--strong"
                : item.tone === "medium"
                  ? "dashboard-chip dashboard-chip--medium"
                  : "dashboard-chip";

            return (
              <span key={item.keyword} className={chipClass}>
                {item.keyword}
              </span>
            );
          })
        ) : (
          <p className="dashboard-empty-copy">{ui("No priority keywords are currently visible in the active memory field.")}</p>
        )}
      </div>

      {expanded ? (
        <div className="mt-5">
          <div className="dashboard-accent-line" />
          <div className="mt-4">
            <p className="dashboard-meta-note">{ui("Surfaced Themes")}</p>
            <div className="mt-3 grid gap-2.5">
              {themes.length > 0 ? (
                portrait.themes.map((theme) => (
                  <div
                    key={theme.label}
                    className="rounded-[1rem] border border-[rgba(119,156,149,0.18)] bg-white/70 px-3 py-3 text-sm text-slate-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">{theme.label}</span>
                      <span className="dashboard-meta-note">{theme.memoryCount} {ui("memories")}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-[rgba(122,150,144,0.22)] bg-white/58 px-3 py-3">
                  <p className="dashboard-empty-copy">
                    {ui("No surfaced themes are available until more visible memories remain in the field.")}
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
