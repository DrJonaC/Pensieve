"use client";

import { useLocale } from "@/lib/locale";
import { redactSensitiveText } from "@/lib/privacy";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MemoryInspectorPanel } from "@/components/plugin/MemoryInspectorPanel";
import { MemoryListPanel } from "@/components/plugin/MemoryListPanel";
import { MemorySnapshotPanel } from "@/components/plugin/MemorySnapshotPanel";
import { MemoryThemePanel } from "@/components/plugin/MemoryThemePanel";
import { resolveHostAdapter } from "@/lib/hosts/resolve-host-adapter";
import type {
  DashboardState,
  HostContext,
  MemoryAction,
  MemoryProvider
} from "@/lib/plugin-types";

const initialState: DashboardState = {
  storageInfo: null,
  snapshot: null,
  memories: [],
  selectedMemoryId: null,
  selectedTrace: null,
  isLoading: true,
  error: null
};

export function PluginDashboard() {
  const { ui } = useLocale();
  const searchParams = useSearchParams();
  const hostAdapter = useMemo(
    () => resolveHostAdapter(searchParams.get("host")),
    [searchParams]
  );
  const hostContext = useMemo<HostContext>(() => hostAdapter.getContext(), [hostAdapter]);
  const provider = useMemo<MemoryProvider>(() => hostAdapter.getProvider(), [hostAdapter]);
  const [state, setState] = useState<DashboardState>(initialState);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [storageInfo, snapshot, memories] = await Promise.all([
          provider.getStorageInfo(),
          provider.getSnapshot(),
          provider.listMemories()
        ]);

        if (cancelled) {
          return;
        }

        setState((current) => {
          const selectedMemoryId =
            current.selectedMemoryId && memories.some((memory) => memory.id === current.selectedMemoryId)
              ? current.selectedMemoryId
              : memories[0]?.id ?? null;

          return {
            ...current,
            storageInfo,
            snapshot,
            memories,
            selectedMemoryId,
            isLoading: false,
            error: null
          };
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load plugin dashboard."
        }));
      }
    };

    void load();
    const unsubscribe = provider.subscribe?.(() => {
      void load();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [provider]);

  useEffect(() => {
    let cancelled = false;

    const selectedMemoryId = state.selectedMemoryId;
    if (!selectedMemoryId) {
      setState((current) => ({ ...current, selectedTrace: null }));
      return;
    }

    void provider.getMemoryTrace(selectedMemoryId).then(
      (trace) => {
        if (!cancelled) {
          setState((current) => ({ ...current, selectedTrace: trace }));
        }
      },
      (error) => {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : "Failed to load memory trace."
          }));
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [provider, state.selectedMemoryId]);

  const selectedMemory =
    state.memories.find((memory) => memory.id === state.selectedMemoryId) ?? null;
  const vectorCount = state.memories.filter(memory => memory.status !== "hidden").length;

  const handleAction = async (action: MemoryAction) => {
    try {
      await provider.applyAction(action);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Failed to apply memory action."
      }));
    }
  };

  return (
    <div
      className={`plugin-layout plugin-layout--sidebar ${
        isExpanded ? "plugin-layout--sidebar-expanded" : "plugin-layout--sidebar-collapsed"
      }`}
    >
      <section className="dashboard-panel plugin-header-shell rounded-[1.6rem] p-4">
        <div className="plugin-header-shell__top">
          <div className="plugin-meta plugin-meta--sidebar">
            <p className="plugin-meta__eyebrow">{ui("Host-Agnostic Plugin Core")}</p>
            <h1 className="plugin-meta__title plugin-meta__title--sidebar">Pensieve</h1>
            <p className="plugin-meta__copy plugin-meta__copy--sidebar">
              {ui("Structured memory dashboard for reviewing captured-memory artifacts and lightly governing their state.")}
            </p>
            <p className="plugin-host-copy">{ui(hostContext.description)}</p>
          </div>
          <div className="plugin-header-shell__badge">
            <div className="flex items-center gap-2">
              <span className="dashboard-status-pill">{hostContext.displayName}</span>
              <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                className="dashboard-toggle"
                aria-pressed={isExpanded}
              >
                {isExpanded ? ui("Collapse") : ui("Expand")}
              </button>
            </div>
          </div>
        </div>

        <div className="plugin-status-rail">
          <StatusRailItem label={ui("Mode")} value={ui("Dashboard")} />
          <StatusRailItem label={ui("Host")} value={hostContext.displayName} />
          <StatusRailItem label={ui("Memories")} value={String(state.snapshot?.total ?? state.memories.length)} />
          <StatusRailItem label={ui("Searchable")} value={String(vectorCount)} />
          <StatusRailItem
            label={ui("Selected")}
            value={selectedMemory ? selectedMemory.id.replace("memory-", "M-") : ui("None")}
          />
        </div>

        <div className="plugin-capability-row">
          <CapabilityPill label={hostContext.capabilities.sidebar ? ui("Sidebar-ready") : ui("Windowed")} />
          <CapabilityPill
            label={hostContext.capabilities.providerInjection ? ui("Provider injection") : ui("Manual provider")}
          />
          <CapabilityPill
            label={hostContext.capabilities.localPathsVisible ? ui("Local paths visible") : ui("Paths abstracted")}
          />
        </div>
      </section>

      {state.error ? (
        <div className="dashboard-panel rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
          {ui("Error")}: {redactSensitiveText(state.error)}
        </div>
      ) : null}

      <div className="plugin-sidebar-shell">
        <MemorySnapshotPanel
          snapshot={state.snapshot}
          storageInfo={state.storageInfo}
          compact={!isExpanded}
        />
        {isExpanded ? <MemoryThemePanel snapshot={state.snapshot} compact={false} /> : null}

        <MemoryListPanel
          memories={state.memories}
          selectedMemoryId={state.selectedMemoryId}
          compact={!isExpanded}
          onSelect={(memoryId) =>
            setState((current) => {
              if (!isExpanded) {
                setIsExpanded(true);
              }

              return {
                ...current,
                selectedMemoryId: memoryId
              };
            })
          }
        />
        {isExpanded ? (
          <MemoryInspectorPanel
            memory={selectedMemory}
            trace={state.selectedTrace}
            compact={false}
            onAction={handleAction}
          />
        ) : (
          <CollapsedInspectorHint
            selectedMemoryId={state.selectedMemoryId}
            onExpand={() => setIsExpanded(true)}
          />
        )}
      </div>

      {state.isLoading ? (
        <div className="dashboard-panel rounded-[1.5rem] p-4 text-sm text-slate-500 plugin-sidebar-status">
          {ui("Hydrating local memory artifacts...")}
        </div>
      ) : null}
    </div>
  );
}

function StatusRailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="plugin-status-rail__item">
      <p className="dashboard-meta-note">{label}</p>
      <p className="plugin-status-rail__value">{value}</p>
    </div>
  );
}

function CapabilityPill({ label }: { label: string }) {
  return <span className="dashboard-status-pill">{label}</span>;
}

function CollapsedInspectorHint({
  selectedMemoryId,
  onExpand
}: {
  selectedMemoryId: string | null;
  onExpand: () => void;
}) {
  const { ui, t } = useLocale();
  return (
    <section className="dashboard-panel rounded-[1.5rem] p-4">
      <p className="dashboard-kicker">{ui("Inspector")}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">
        {selectedMemoryId
          ? t(`Memory ${selectedMemoryId.replace("memory-", "M-")} is selected.`, `已选择记忆 ${selectedMemoryId.replace("memory-", "M-")}。`)
          : ui("Select a memory to inspect its trace and controls.")}
      </p>
      <p className="dashboard-subcopy mt-2">
        {ui("Expand the sidebar to review storage paths, source traces, and lightweight governance actions.")}
      </p>
      <button type="button" onClick={onExpand} className="dashboard-toggle mt-4">
        {ui("Expand Inspector")}
      </button>
    </section>
  );
}
