import type { MemorySnapshot, StorageInfo } from "@/lib/plugin-types";

type MemorySnapshotPanelProps = {
  snapshot: MemorySnapshot | null;
  storageInfo: StorageInfo | null;
  compact?: boolean;
};

export function MemorySnapshotPanel({
  snapshot,
  storageInfo,
  compact = false
}: MemorySnapshotPanelProps) {
  if (!snapshot) {
    return (
      <section className="dashboard-panel rounded-[1.75rem] p-5">
        <p className="dashboard-empty-copy">Loading the local memory field...</p>
      </section>
    );
  }

  const metrics = [
    { label: "Total", value: snapshot.total },
    { label: "Active", value: snapshot.active },
    { label: "Softened", value: snapshot.softened },
    { label: "Hidden", value: snapshot.hidden },
    { label: "Pinned", value: snapshot.pinned },
    { label: "High Risk", value: snapshot.highRisk }
  ];

  return (
    <section className="dashboard-panel rounded-[1.75rem] p-5 md:p-6">
      <div className={`flex gap-4 ${compact ? "flex-col" : "flex-col md:flex-row md:items-start md:justify-between"}`}>
        <div className={`${compact ? "space-y-2" : "max-w-2xl space-y-2"}`}>
          <p className="dashboard-kicker">Structured Memory Layer</p>
          <h1 className="dashboard-heading">Pensieve Plugin Core</h1>
          <p className="dashboard-subcopy">
            This dashboard exposes structured memory distilled from captured events, along with the
            local paths where those memories and vector artifacts live.
          </p>
        </div>
        {storageInfo ? (
          <div className={`rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 shadow-sm ${compact ? "" : "text-right"}`}>
            <p className="dashboard-meta-note">Provider</p>
            <p className="text-sm font-medium text-slate-700">{storageInfo.providerName}</p>
          </div>
        ) : null}
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-6"}`}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-200/70 bg-white/72 px-4 py-4 shadow-sm"
          >
            <p className="dashboard-meta-note">{metric.label}</p>
            <p className="dashboard-metric-value mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {storageInfo ? (
        <div className={`mt-5 grid gap-3 ${compact ? "grid-cols-1" : "lg:grid-cols-3"}`}>
          <PathCard label="Memory Store" path={storageInfo.memoryStorePath} />
          <PathCard label="Capture Store" path={storageInfo.captureStorePath ?? "Not yet mapped"} />
          <PathCard label="Vector Store" path={storageInfo.vectorStorePath ?? "Not yet mapped"} />
        </div>
      ) : null}
    </section>
  );
}

function PathCard({ label, path }: { label: string; path: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/72 px-4 py-4 shadow-sm">
      <p className="dashboard-meta-note">{label}</p>
      <p className="mt-2 break-all text-xs leading-6 text-slate-600">{path}</p>
    </div>
  );
}
