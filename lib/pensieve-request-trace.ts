import type { QuerySubmissionState } from "./pensieve-query-lifecycle.ts";

export type RequestTraceModel = {
  statusLabel: string;
  cards: Array<{
    label: string;
    value: string;
  }>;
};

function formatTime(value: string | null): string {
  return value ? new Date(value).toLocaleTimeString() : "Not yet";
}

function formatLatency(latencyMs: number | null): string {
  if (latencyMs === null) {
    return "Pending";
  }

  if (latencyMs < 1000) {
    return `${latencyMs} ms`;
  }

  return `${(latencyMs / 1000).toFixed(2)} s`;
}

export function presentRequestTrace(submission: QuerySubmissionState): RequestTraceModel {
  const statusLabel = submission.pendingRequestId
    ? "Request in flight"
    : submission.outcome === "fallback"
      ? "Settled with local fallback"
      : submission.outcome === "resolved"
        ? "Settled"
        : "Idle";

  return {
    statusLabel,
    cards: [
      {
        label: "Submitted Query",
        value: submission.lastSubmittedQuery || "No query submitted in this session yet."
      },
      {
        label: "Requested Mode",
        value: submission.lastRequestedMode ? submission.lastRequestedMode.toUpperCase() : "Not yet"
      },
      {
        label: "Response Source",
        value: submission.lastResponseSource ? submission.lastResponseSource.toUpperCase() : "Not yet"
      },
      {
        label: "Submitted",
        value: formatTime(submission.submittedAt)
      },
      {
        label: "Settled",
        value: submission.pendingRequestId ? "Waiting" : formatTime(submission.settledAt)
      },
      {
        label: "Latency",
        value: submission.pendingRequestId ? "Waiting" : formatLatency(submission.latencyMs)
      }
    ]
  };
}
