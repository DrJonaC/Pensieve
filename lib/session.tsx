"use client";

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { baseMemories, buildDormantActivationResult, simulateActivation } from "@/lib/memory";
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
  mergeMemoryExplanationMap,
  partitionMemoriesForQuery,
  type NarrativeState,
  type PartitionedMemories,
  type PensieveMode,
  type QueryApiResponse
} from "@/lib/query";

type PensieveStore = {
  mode: PensieveMode;
  session: MemorySessionState;
  narrative: NarrativeState;
  displayedReasons: Record<string, string>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySessionMutation = (transform: (current: MemorySessionState) => MemorySessionState) => {
    setSession((current) => {
      const next = transform(current);
      setNarrative(buildMockNarrative(next.result));
      setError(null);
      return next;
    });
  };

  const submitQuery = async () => {
    let partitioned: PartitionedMemories | null = null;
    let query = "";
    let shouldCallLive = false;

    setSession((current) => {
      query = current.query;
      const nextActivation = current.query.trim()
        ? simulateActivation(current.query, baseMemories, current.modifiers)
        : buildDormantActivationResult(baseMemories, current.modifiers, current.query);

      if (current.query.trim()) {
        partitioned = partitionMemoriesForQuery(nextActivation.memories);
      } else {
        partitioned = null;
      }

      const nextSession = applyQueryResult(current, current.query, nextActivation);
      setNarrative(buildMockNarrative(nextSession.result));
      setError(null);
      shouldCallLive = mode === "live" && Boolean(current.query.trim());
      setIsLoading(shouldCallLive);
      return nextSession;
    });

    if (!partitioned || !shouldCallLive || !query.trim()) {
      return;
    }

    const safePartitioned = partitioned as PartitionedMemories;

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode: "live", query, memories: safePartitioned.llmMemories, cdv_memories: safePartitioned.cdvMemories ?? [] })
      });

      const payload = (await response.json()) as QueryApiResponse;
      if (!response.ok || !payload.ok || !payload.data || !payload.meta) {
        throw new Error(payload.error ?? "Live LLM mode failed.");
      }

      setNarrative({
        ...payload.data,
        provider: payload.meta.provider,
        model: payload.meta.model,
        source: "live"
      });

      const cdvResults = payload.data.cdv_results ?? {};
      setSession((current) => ({
        ...current,
        result: {
          ...current.result,
          memories: current.result.memories.map((m) => ({
            ...m,
            cdv: cdvResults[m.id] ?? null
          }))
        }
      }));

      setError(null);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Live LLM mode failed.";
      setError(`${message} Falling back to local mock narrative.`);
    } finally {
      setIsLoading(false);
    }
  };

  const store = useMemo<PensieveStore>(
    () => ({
      mode,
      session,
      narrative,
      displayedReasons: mergeMemoryExplanationMap(session.result.reasons, narrative.memory_explanations),
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
    [mode, session, narrative, isLoading, error]
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
