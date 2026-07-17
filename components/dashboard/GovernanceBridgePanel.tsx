import {
  type GovernanceBridgeStatus,
  type GovernanceReceipt,
  type GovernanceReportArtifact
} from "@/lib/pensieve-governance-bridge";

type GovernanceBridgePanelProps = {
  status: GovernanceBridgeStatus | null;
  artifact: GovernanceReportArtifact | null;
  receipt: GovernanceReceipt | null;
  error: string | null;
  isBusy: boolean;
  onGenerate: () => void;
  onApply: (reportId: string) => void;
};

export function GovernanceBridgePanel({
  status,
  artifact,
  receipt,
  error,
  isBusy,
  onGenerate,
  onApply
}: GovernanceBridgePanelProps) {
  const report = artifact?.report ?? status?.latest_report ?? null;
  const currentReceipt = receipt ?? status?.latest_receipt ?? null;
  const pendingCount = status?.pending_change_count ?? 0;
  const reportIsVerified = Boolean(
    currentReceipt && currentReceipt.report_id === report?.report_id && currentReceipt.status === "verified"
  );

  return (
    <section className="dashboard-panel rounded-[1.45rem] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dashboard-kicker">Governance Bridge</p>
          <h3 className="dashboard-section-title mt-1">Carry user decisions back to memory</h3>
          <p className="dashboard-subcopy mt-2 max-w-[30rem]">
            Compile the current governed state into a reviewable Markdown report and a deterministic host manifest.
          </p>
        </div>
        <span className="dashboard-status-pill">
          {pendingCount > 0 ? `${pendingCount} pending` : reportIsVerified ? "Verified" : "In sync"}
        </span>
      </div>

      {error ? <p className="mt-3 text-sm text-[rgb(126,82,77)]">{error}</p> : null}

      <div className="dashboard-accent-line my-4" />

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          className="dashboard-action-button dashboard-action-button--accent"
          disabled={isBusy || pendingCount === 0}
          onClick={onGenerate}
        >
          {isBusy ? "Working..." : "Generate report"}
        </button>
        <button
          type="button"
          className="dashboard-action-button"
          disabled={isBusy || !report}
          onClick={() => report && onApply(report.report_id)}
        >
          Apply & verify
        </button>
      </div>

      {report ? (
        <div className="mt-4 rounded-2xl border border-[rgba(124,153,146,0.18)] bg-white/55 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-800">{report.report_id}</p>
            <span className="dashboard-meta-note">{report.changes.length} changes</span>
          </div>
          <p className="dashboard-subcopy mt-1">
            {artifact?.markdown_path ?? "Latest governance report is ready for provider synchronization."}
          </p>
          {currentReceipt?.report_id === report.report_id ? (
            <p className="mt-2 text-xs font-medium capitalize text-[rgb(70,105,97)]">
              Receipt: {currentReceipt.status} · {currentReceipt.items.length} checked
            </p>
          ) : null}
        </div>
      ) : (
        <p className="dashboard-empty-copy mt-4">
          Governance changes will appear here after you pin, soften, hide, or restore a memory.
        </p>
      )}
    </section>
  );
}
