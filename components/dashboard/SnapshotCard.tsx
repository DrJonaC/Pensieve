"use client";

import { useLocale } from "@/lib/locale";
import { type DashboardSnapshot } from "@/lib/pensieve-dashboard-core";

type SnapshotCardProps = {
  snapshot: DashboardSnapshot;
  compact?: boolean;
};

const snapshotItems: Array<{
  key: keyof Pick<
    DashboardSnapshot,
    "total_count" | "active_count" | "pinned_count" | "hidden_count" | "high_risk_count"
  >;
  label: string;
}> = [
  { key: "total_count", label: "Total" },
  { key: "active_count", label: "Active" },
  { key: "pinned_count", label: "Pinned" },
  { key: "hidden_count", label: "Hidden" },
  { key: "high_risk_count", label: "High Risk" }
];

export function SnapshotCard({ snapshot, compact = false }: SnapshotCardProps) {
  const { ui, language } = useLocale();
  return (
    <section className="dashboard-panel rounded-[1.45rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="dashboard-kicker">{ui("Snapshot")}</p>
          <h3 className="dashboard-section-title mt-1">{ui("Memory field")}</h3>
        </div>
        <span className="dashboard-meta-note">
          {ui("Updated")} {new Date(snapshot.last_updated_at).toLocaleDateString(language)}
        </span>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-2"}`}>
        {snapshotItems.map((item) => (
          <div
            key={item.key}
            className="rounded-[1rem] border border-[rgba(111,142,136,0.18)] bg-white/75 px-3 py-3"
          >
            <p className="dashboard-meta-note">{ui(item.label)}</p>
            <p className="dashboard-metric-value mt-2">{snapshot[item.key]}</p>
          </div>
        ))}
      </div>

      {snapshot.total_count === 0 ? (
        <p className="dashboard-empty-copy mt-4">
          {ui("The local repository is empty. Pensieve will surface a memory field once records are seeded by the provider.")}
        </p>
      ) : null}
    </section>
  );
}
