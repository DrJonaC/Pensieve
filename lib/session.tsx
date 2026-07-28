"use client";

import { createContext, useContext, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { baseMemories, buildDormantActivationResult } from "@/lib/memory";
import {
  applyQueryResult,
  createInitialSessionState,
  markForgotten,
  resetSessionView,
  restoreForgottenMemories,
  setSessionQuery,
  togglePinned,
  toggleSoftened,
  undoLastSessionAction,
  type MemorySessionState
} from "@/lib/memory-state";
import {
  buildMockNarrative,
  type LLMQueryResult,
  mergeMemoryExplanationMap,
  type NarrativeState,
  type PensieveMode
} from "@/lib/query";
import {
  attachCdvResults,
  prepareQueryExecution,
  requestLiveNarrative
} from "@/lib/pensieve-query-runtime";
import {
  beginQuerySubmission,
  initialQuerySubmissionState,
  isStaleQueryResponse,
  settleQuerySubmission,
  type QuerySubmissionState
} from "@/lib/pensieve-query-lifecycle";

type PensieveStore = {
  mode: PensieveMode;
  session: MemorySessionState;
  narrative: NarrativeState;
  displayedReasons: Record<string, string>;
  submission: QuerySubmissionState;
  isLoading: boolean;
  error: string | null;
  setMode: (mode: PensieveMode) => void;
  setQuery: (query: string) => void;
  submitQuery: () => Promise<void>;
  toggleSoftenedMemory: (memoryId: string) => void;
  togglePinnedMemory: (memoryId: string) => void;
  forgetMemory: (memoryId: string) => void;
  restoreForgotten: () => void;
  resetView: () => void;
  undo: () => void;
};

const DEFAULT_QUERY = "Design a calm AI interface that explains what it remembers about me.";

const initialSession = createInitialSessionState(baseMemories, DEFAULT_QUERY);
const initialNarrative = buildMockNarrative(
  buildDormantActivationResult(baseMemories, initialSession.modifiers, DEFAULT_QUERY)
);

const PensieveContext = createContext<PensieveStore | null>(null);

export function PensieveProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<PensieveMode>("mock");
  const [session, setSession] = useState<MemorySessionState>(initialSession);
  const [narrative, setNarrative] = useState<NarrativeState>(initialNarrative);
  const [submission, setSubmission] = useState<QuerySubmissionState>(initialQuerySubmissionState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionRef = useRef<QuerySubmissionState>(initialQuerySubmissionState);

  const applySessionMutation = (transform: (current: MemorySessionState) => MemorySessionState) => {
    setSession((current) => {
      const next = transform(current);
      setNarrative(buildMockNarrative(next.result));
      setError(null);
      return next;
    });
  };

  const submitQuery = async () => {
    let liveResult: (LLMQueryResult & { provider: string; model: string }) | null = null;
    let query = "";
    let execution = prepareQueryExecution({
      query: session.query,
      modifiers: session.modifiers,
      mode
    });
    let shouldCallLive = false;
    let currentSubmission = initialQuerySubmissionState;
    const submittedAt = new Date().toISOString();

    setSession((current) => {
      query = current.query;
      execution = prepareQueryExecution({
        query: current.query,
        modifiers: current.modifiers,
        mode
      });

      const nextSession = applyQueryResult(current, current.query, execution.activation);
      setNarrative(buildMockNarrative(nextSession.result));
      setError(null);
      shouldCallLive = execution.shouldRequestLive;
      setIsLoading(shouldCallLive);
      setSubmission((previous) => {
        currentSubmission = beginQuerySubmission(previous, current.query, submittedAt, mode);
        submissionRef.current = currentSubmission;
        return currentSubmission;
      });
      return nextSession;
    });

    if (!execution.partitioned || !shouldCallLive || !query.trim()) {
      const settledAt = new Date().toISOString();
      setSubmission((previous) => {
        const next = settleQuerySubmission(previous, currentSubmission.requestId, settledAt, "mock");
        submissionRef.current = next;
        return next;
      });
      return;
    }

    try {
      liveResult = await requestLiveNarrative(query, execution.partitioned);
      if (isStaleQueryResponse(submissionRef.current, currentSubmission.requestId)) {
        return;
      }
      setNarrative({
        ...liveResult,
        source: "live"
      });

      setSession((current) => ({
        ...current,
        result: {
          ...current.result,
          response: liveResult?.answer ?? current.result.response,
          memories: attachCdvResults(current.result.memories, liveResult?.cdv_results)
        }
      }));

      setError(null);
    } catch (requestError) {
      if (isStaleQueryResponse(submissionRef.current, currentSubmission.requestId)) {
        return;
      }
      const message = requestError instanceof Error ? requestError.message : "Live LLM mode failed.";
      setError(`${message} Falling back to local mock narrative.`);
    } finally {
      if (!isStaleQueryResponse(submissionRef.current, currentSubmission.requestId)) {
        const settledAt = new Date().toISOString();
        setSubmission((previous) => {
          const next = settleQuerySubmission(
            previous,
            currentSubmission.requestId,
            settledAt,
            liveResult ? "live" : "mock",
            liveResult ? "resolved" : "fallback"
          );
          submissionRef.current = next;
          return next;
        });
        setIsLoading(false);
      }
    }
  };

  const store = useMemo<PensieveStore>(
    () => ({
      mode,
      session,
      narrative,
      displayedReasons: mergeMemoryExplanationMap(session.result.reasons, narrative.memory_explanations),
      submission,
      isLoading,
      error,
      setMode: (nextMode) => {
        setModeState(nextMode);
        setError(null);
        if (nextMode === "mock") {
          setNarrative(buildMockNarrative(session.result));
        }
      },
      setQuery: (query) => setSession((current) => setSessionQuery(current, query)),
      submitQuery,
      toggleSoftenedMemory: (memoryId) =>
        applySessionMutation((current) => toggleSoftened(current, baseMemories, memoryId)),
      togglePinnedMemory: (memoryId) =>
        applySessionMutation((current) => togglePinned(current, baseMemories, memoryId)),
      forgetMemory: (memoryId) =>
        applySessionMutation((current) => markForgotten(current, baseMemories, memoryId)),
      restoreForgotten: () =>
        applySessionMutation((current) => restoreForgottenMemories(current, baseMemories)),
      resetView: () =>
        applySessionMutation((current) => resetSessionView(current, baseMemories)),
      undo: () =>
        applySessionMutation((current) => undoLastSessionAction(current))
    }),
    [mode, session, narrative, submission, isLoading, error]
  );

  return <PensieveContext.Provider value={store}>{children}</PensieveContext.Provider>;
}

export function usePensieve(): PensieveStore {
  const context = useContext(PensieveContext);

  if (!context) {
    throw new Error("usePensieve must be used inside PensieveProvider.");
  }

  return context;
}
