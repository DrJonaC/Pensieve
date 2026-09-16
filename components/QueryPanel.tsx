"use client";

import { useLocale } from "@/lib/locale";
import { redactSensitiveText } from "@/lib/privacy";

import { InputBox } from "@/components/InputBox";
import { ModeToggle } from "@/components/ModeToggle";
import { SessionControls } from "@/components/SessionControls";
import { type QuerySubmissionState } from "@/lib/pensieve-query-lifecycle";
import { type PensieveMode } from "@/lib/query";
import { type QueryFlowStatus } from "@/lib/pensieve-query-view";

type QueryPanelProps = {
  query: string;
  mode: PensieveMode;
  status: QueryFlowStatus;
  isLoading: boolean;
  canUndo: boolean;
  error: string | null;
  submission: QuerySubmissionState;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onModeChange: (mode: PensieveMode) => void;
  onResetView: () => void;
  onRestoreForgotten: () => void;
  onUndo: () => void;
};

function getStatusCopy(status: QueryFlowStatus, error: string | null): string {
  if (error) {
    return error;
  }

  switch (status) {
    case "loading":
      return "Surfacing the current memory field and waiting for the response layer to settle.";
    case "draft":
      return "The draft changed. Submit to refresh the answer, summary, and activation surface together.";
    case "resolved":
      return "The current answer, memory summary, and activation map are aligned to the last submitted query.";
    default:
      return "Ask a question to watch memory retrieval, reranking, and governance state come into view.";
  }
}

export function QueryPanel({
  query,
  mode,
  status,
  isLoading,
  canUndo,
  error,
  submission,
  onQueryChange,
  onSubmit,
  onModeChange,
  onResetView,
  onRestoreForgotten,
  onUndo
}: QueryPanelProps) {
  const { ui, language } = useLocale();
  return (
    <section className="rounded-[1.8rem] border border-cyan-300/12 bg-slate-950/55 p-5 shadow-[0_24px_60px_rgba(3,8,20,0.32)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.26em] text-cyan-200/75">{ui("Surface Memory")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{ui("Query-based memory observability")}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            {ui("Submit a query to trigger retrieval, reranking, explanation, and token-level influence in one coherent flow.")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <ModeToggle mode={mode} onChange={onModeChange} disabled={isLoading} />
          <SessionControls
            canUndo={canUndo}
            onResetView={onResetView}
            onRestoreForgotten={onRestoreForgotten}
            onUndo={onUndo}
          />
        </div>
      </div>

      <div className="mt-4">
        <InputBox
          value={query}
          onChange={onQueryChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          modeLabel={mode === "mock" ? ui("Mock Mode") : ui("Live Mode")}
        />
      </div>

      <div
        className={`mt-4 rounded-[1.35rem] border px-4 py-3 text-sm leading-6 ${
          error
            ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
            : status === "loading"
              ? "border-cyan-300/18 bg-cyan-300/8 text-cyan-50"
              : "border-white/10 bg-white/5 text-slate-300"
        }`}
      >
        {error ? <>{ui("Error")}: {redactSensitiveText(error)}</> : ui(getStatusCopy(status, null))}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em] text-cyan-100/55">
        <span>{ui("Last submit:")} {submission.submittedAt ? new Date(submission.submittedAt).toLocaleTimeString(language) : ui("none")}</span>
        <span>{ui("Last settle:")} {submission.settledAt ? new Date(submission.settledAt).toLocaleTimeString(language) : ui("pending")}</span>
        <span>{submission.pendingRequestId ? ui("Request in flight") : ui("Session settled")}</span>
        <span>{ui("Source:")} {ui(submission.lastResponseSource ?? "not-yet")}</span>
      </div>
    </section>
  );
}
