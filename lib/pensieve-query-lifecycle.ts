export type QuerySubmissionState = {
  requestId: number;
  submittedAt: string | null;
  settledAt: string | null;
  lastSubmittedQuery: string;
  pendingRequestId: number | null;
  lastRequestedMode: "mock" | "live" | null;
  lastResponseSource: "mock" | "live" | null;
  latencyMs: number | null;
  outcome: "idle" | "resolved" | "fallback";
};

export const initialQuerySubmissionState: QuerySubmissionState = {
  requestId: 0,
  submittedAt: null,
  settledAt: null,
  lastSubmittedQuery: "",
  pendingRequestId: null,
  lastRequestedMode: null,
  lastResponseSource: null,
  latencyMs: null,
  outcome: "idle"
};

export function beginQuerySubmission(
  current: QuerySubmissionState,
  query: string,
  submittedAt: string,
  mode: "mock" | "live"
): QuerySubmissionState {
  const requestId = current.requestId + 1;

  return {
    requestId,
    submittedAt,
    settledAt: null,
    lastSubmittedQuery: query,
    pendingRequestId: requestId,
    lastRequestedMode: mode,
    lastResponseSource: current.lastResponseSource,
    latencyMs: null,
    outcome: "idle"
  };
}

export function settleQuerySubmission(
  current: QuerySubmissionState,
  requestId: number,
  settledAt: string,
  source: "mock" | "live",
  outcome: "resolved" | "fallback" = "resolved"
): QuerySubmissionState {
  if (current.pendingRequestId !== requestId) {
    return current;
  }

  const latencyMs =
    current.submittedAt === null
      ? null
      : Math.max(0, new Date(settledAt).getTime() - new Date(current.submittedAt).getTime());

  return {
    ...current,
    settledAt,
    pendingRequestId: null,
    lastResponseSource: source,
    latencyMs,
    outcome
  };
}

export function isStaleQueryResponse(
  current: QuerySubmissionState,
  requestId: number
): boolean {
  return current.pendingRequestId !== requestId;
}
