"use client";

import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { createInitialSessionState, type MemorySessionState } from "@/lib/memory-state";
import { activateRepository } from "@/lib/repository-activation";
import { buildMockNarrative, mergeMemoryExplanationMap, type NarrativeState, type PensieveMode } from "@/lib/query";
import { beginQuerySubmission, initialQuerySubmissionState, settleQuerySubmission } from "@/lib/pensieve-query-lifecycle";
import type { PersistedMemoryRecord } from "@/lib/memory-store";
import { notifyMemoryChange, subscribeMemoryChanges } from "@/lib/memory-events";

const empty = createInitialSessionState([]);
type Library = { records: PersistedMemoryRecord[]; revision: string };
type Store = {
  mode: PensieveMode; session: MemorySessionState; narrative: NarrativeState;
  displayedReasons: Record<string, string>; submission: typeof initialQuerySubmissionState;
  isLoading: boolean; error: string | null;
  setMode: (mode: PensieveMode) => void; setQuery: (query: string) => void;
  submitQuery: () => Promise<void>; toggleSoftenedMemory: (id: string) => void;
  togglePinnedMemory: (id: string) => void; forgetMemory: (id: string) => void;
  restoreForgotten: () => void; resetView: () => void; undo: () => void;
};
const Context = createContext<Store | null>(null);

export function PensieveProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<PensieveMode>("mock");
  const [session, setSession] = useState(empty);
  const [narrative, setNarrative] = useState(buildMockNarrative(empty.result));
  const [submission, setSubmission] = useState(initialQuerySubmissionState);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const library = useRef<Library | null>(null);
  const state = useRef(session);
  state.current = session;
  const generation = useRef(0);
  const busy = useRef(false);
  const pathname = usePathname();

  function accept(next: Library, history = state.current.history) {
    const result = activateRepository(state.current.query, next.records);
    const modifiers = Object.fromEntries(next.records.map(m => [m.id, { pinned: m.pinned, status: m.status }]));
    library.current = next;
    const updated = { query: state.current.query, history, modifiers, result };
    state.current = updated;
    setSession(updated);
    setNarrative(buildMockNarrative(result));
  }

  useEffect(() => {
    let disposed = false;
    async function refresh() {
      if (busy.current) return;
      const token = generation.current;
      try {
        const response = await fetch("/api/memories", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (disposed || busy.current || token !== generation.current || data.revision === library.current?.revision) return;
        generation.current++;
        setLoading(false);
        accept(data, []);
        setError(null);
      } catch (e) {
        if (!disposed) { setLoading(false); setError(e instanceof Error ? e.message : "Cannot read memories / 无法读取记忆"); }
      }
    }
    void refresh();
    const unsubscribe = subscribeMemoryChanges(() => void refresh());
    return () => { disposed = true; unsubscribe(); };
  }, [pathname]);

  async function submitQuery() {
    if (busy.current || !library.current) return;
    const token = ++generation.current;
    const nextSubmission = beginQuerySubmission(submission, session.query, new Date().toISOString(), mode);
    setSubmission(nextSubmission);
    setLoading(true); setError(null);
    let source: PensieveMode = "mock";
    let failed = false;
    try {
      const response = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: session.query, mode }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      if (token !== generation.current) return;
      source = payload.data.source;
      setNarrative(payload.data);
      setSession(current => ({ ...current, result: payload.activation }));
      setError(payload.warning);
    } catch (e) {
      failed = true;
      if (token === generation.current) setError(e instanceof Error ? e.message : "Request failed / 请求失败");
    } finally {
      if (token === generation.current) {
        setLoading(false);
        setSubmission(settleQuerySubmission(nextSubmission, nextSubmission.requestId, new Date().toISOString(), source, failed ? "fallback" : "resolved"));
      }
    }
  }

  async function govern(transform: (current: MemorySessionState["modifiers"]) => MemorySessionState["modifiers"], undoing = false) {
    if (busy.current || !library.current) return;
    busy.current = true; generation.current++; setLoading(true); setError(null);
    const before = state.current;
    const changes = transform(before.modifiers);
    try {
      const response = await fetch("/api/memories", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "govern", revision: library.current.revision,
          changes: Object.entries(changes).map(([id, value]) => ({ id, ...value })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      accept(data, undoing ? before.history.slice(0, -1) : [...before.history, { modifiers: before.modifiers, query: before.query, result: before.result }]);
      notifyMemoryChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed / 保存失败");
    } finally { busy.current = false; setLoading(false); }
  }
  function change(id: string, update: (value: MemorySessionState["modifiers"][string]) => MemorySessionState["modifiers"][string]) {
    void govern(current => current[id] ? { ...current, [id]: update(current[id]) } : current);
  }
  const store: Store = {
    mode, session, narrative, submission, isLoading, error,
    displayedReasons: mergeMemoryExplanationMap(session.result.reasons, narrative.memory_explanations),
    setMode: next => { generation.current++; setLoading(false); setMode(next); setNarrative(buildMockNarrative(session.result)); },
    setQuery: query => setSession(current => ({ ...current, query })),
    submitQuery,
    toggleSoftenedMemory: id => change(id, value => ({ ...value, status: value.status === "softened" ? "active" : "softened" })),
    togglePinnedMemory: id => change(id, value => ({ ...value, pinned: !value.pinned })),
    forgetMemory: id => change(id, value => ({ ...value, status: "forgotten" })),
    restoreForgotten: () => void govern(current => Object.fromEntries(Object.entries(current).map(([id, value]) => [id, { ...value, status: value.status === "forgotten" ? "active" : value.status }]))),
    resetView: () => void govern(current => Object.fromEntries(Object.entries(current).map(([id, value]) => [id, { pinned: false, status: value.status === "forgotten" ? "forgotten" : "active" }]))),
    undo: () => { const previous = session.history.at(-1); if (previous) void govern(() => previous.modifiers, true); }
  };
  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function usePensieve() {
  const value = useContext(Context);
  if (!value) throw new Error("PensieveProvider is required.");
  return value;
}
