"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { GovernanceBridgePanel } from "@/components/dashboard/GovernanceBridgePanel";
import { KeywordThemePanel } from "@/components/dashboard/KeywordThemePanel";
import { MemoryListPanel } from "@/components/dashboard/MemoryListPanel";
import { SnapshotCard } from "@/components/dashboard/SnapshotCard";
import { createLocalMemoryProvider } from "@/lib/pensieve-local-provider";
import {
  applyDashboardAction,
  loadDashboardState
} from "@/lib/pensieve-dashboard-runtime";
import {
  getDashboardShellMode,
  getVisibleMemoryRows
} from "@/lib/pensieve-dashboard-view";
import {
  type DashboardAction,
  type DashboardState,
  type MemoryProvider
} from "@/lib/pensieve-dashboard-core";
import {
  type GovernanceBridgeStatus,
  type GovernanceReceipt,
  type GovernanceReportArtifact
} from "@/lib/pensieve-governance-bridge";

type DashboardShellProps = {
  expanded?: boolean;
  hostLabel?: string;
  onActionComplete?: (action: DashboardAction) => void;
  onExpandedChange?: (expanded: boolean) => void;
  onMemorySelect?: (memoryId: string | null) => void;
  onReady?: (state: DashboardState) => void;
  onShellError?: (message: string) => void;
  provider?: MemoryProvider;
};

export function DashboardShell({
  expanded,
  hostLabel,
  onActionComplete,
  onExpandedChange,
  onMemorySelect,
  onReady,
  onShellError,
  provider
}: DashboardShellProps) {
  const stableProvider = useMemo(
    () => provider ?? createLocalMemoryProvider(),
    [provider]
  );
  const [state, setState] = useState<DashboardState | null>(null);
  const [isExpanded, setIsExpanded] = useState(expanded ?? false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [governanceStatus, setGovernanceStatus] = useState<GovernanceBridgeStatus | null>(null);
  const [governanceArtifact, setGovernanceArtifact] = useState<GovernanceReportArtifact | null>(null);
  const [governanceReceipt, setGovernanceReceipt] = useState<GovernanceReceipt | null>(null);
  const [governanceError, setGovernanceError] = useState<string | null>(null);
  const [isGovernanceBusy, setIsGovernanceBusy] = useState(false);
  const shellMode = getDashboardShellMode(isExpanded);

  const refreshGovernanceStatus = useCallback(async () => {
    if (!stableProvider.getGovernanceStatus) {
      return;
    }

    try {
      setGovernanceStatus(await stableProvider.getGovernanceStatus());
      setGovernanceError(null);
    } catch (reason) {
      setGovernanceError(reason instanceof Error ? reason.message : "Failed to read governance status.");
    }
  }, [stableProvider]);

  useEffect(() => {
    if (expanded === undefined) {
      return;
    }

    setIsExpanded(expanded);
  }, [expanded]);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    loadDashboardState(stableProvider)
      .then((nextState) => {
        if (!isActive) {
          return;
        }

        setState(nextState);
        setSelectedMemoryId(nextState.derived.visible_memories[0]?.id ?? null);
        onReady?.(nextState);
      })
      .catch((reason) => {
        if (!isActive) {
          return;
        }

        const message =
          reason instanceof Error ? reason.message : "Failed to load the memory dashboard.";
        setError(message);
        onShellError?.(message);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [onReady, onShellError, stableProvider]);

  useEffect(() => {
    void refreshGovernanceStatus();
  }, [refreshGovernanceStatus]);

  const runAction = (action: DashboardAction) => {
    setPendingActionId(action.memory_id);
    setError(null);

    startTransition(() => {
      applyDashboardAction(stableProvider, action)
        .then((nextState) => {
          setState(nextState);
          onActionComplete?.(action);
          void refreshGovernanceStatus();

          if (nextState.derived.visible_memories.length === 0) {
            setSelectedMemoryId(null);
            return;
          }

          if (
            selectedMemoryId &&
            nextState.memories.some((memory) => memory.id === selectedMemoryId && memory.status !== "hidden")
          ) {
            return;
          }

          setSelectedMemoryId(nextState.derived.visible_memories[0]?.id ?? null);
        })
        .catch((reason) => {
          const message = reason instanceof Error ? reason.message : "Action failed.";
          setError(message);
          onShellError?.(message);
        })
        .finally(() => {
          setPendingActionId(null);
        });
    });
  };

  const generateGovernanceReport = async () => {
    if (!stableProvider.generateGovernanceReport) {
      return;
    }

    setIsGovernanceBusy(true);
    setGovernanceError(null);

    try {
      const artifact = await stableProvider.generateGovernanceReport();
      setGovernanceArtifact(artifact);
      setGovernanceReceipt(null);
      await refreshGovernanceStatus();
    } catch (reason) {
      setGovernanceError(reason instanceof Error ? reason.message : "Failed to generate governance report.");
    } finally {
      setIsGovernanceBusy(false);
    }
  };

  const applyGovernanceReport = async (reportId: string) => {
    if (!stableProvider.applyGovernanceReport) {
      return;
    }

    setIsGovernanceBusy(true);
    setGovernanceError(null);

    try {
      const receipt = await stableProvider.applyGovernanceReport(reportId);
      setGovernanceReceipt(receipt);
      await refreshGovernanceStatus();
    } catch (reason) {
      setGovernanceError(reason instanceof Error ? reason.message : "Failed to apply governance report.");
    } finally {
      setIsGovernanceBusy(false);
    }
  };

  return (
    <div className={`dashboard-shell ${isExpanded ? "dashboard-shell--expanded" : ""}`}>
      <div className="dashboard-panel rounded-[1.7rem] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="dashboard-kicker">Pensieve</p>
            <h2 className="dashboard-heading mt-1">Memory Dashboard</h2>
            <p className="dashboard-subcopy mt-2 max-w-[20rem]">
              A quiet local panel for inspecting what the system continues to hold in view.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="dashboard-status-pill">Query-free</span>
              <span className="dashboard-status-pill">Local provider</span>
              <span className="dashboard-status-pill">Structured memory</span>
              <span className="dashboard-status-pill capitalize">{shellMode.modeLabel} mode</span>
              {hostLabel ? <span className="dashboard-status-pill">{hostLabel}</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setIsExpanded((current) => {
                const next = !current;
                onExpandedChange?.(next);
                return next;
              })
            }
            className="dashboard-toggle"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-panel mt-4 rounded-[1.45rem] p-5">
          <p className="dashboard-kicker">Loading</p>
          <p className="mt-2 text-sm text-slate-600">Drawing the current memory field.</p>
        </div>
      ) : null}

      {error ? (
        <div className="dashboard-panel mt-4 rounded-[1.45rem] border-[rgba(160,115,108,0.22)] p-5">
          <p className="dashboard-kicker">Error</p>
          <p className="mt-2 text-sm text-[rgb(110,79,76)]">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && state ? (
        <div className="mt-4 space-y-4">
          <SnapshotCard snapshot={state.snapshot} compact={!isExpanded} />
          {stableProvider.getGovernanceStatus && stableProvider.generateGovernanceReport && stableProvider.applyGovernanceReport ? (
            <GovernanceBridgePanel
              status={governanceStatus}
              artifact={governanceArtifact}
              receipt={governanceReceipt}
              error={governanceError}
              isBusy={isGovernanceBusy}
              onGenerate={() => void generateGovernanceReport()}
              onApply={(reportId) => void applyGovernanceReport(reportId)}
            />
          ) : null}
          <KeywordThemePanel
            keywords={state.derived.top_keywords.slice(0, shellMode.keywordsLimit)}
            themes={state.derived.surfaced_themes}
            expanded={shellMode.expanded}
          />
          <MemoryListPanel
            memories={getVisibleMemoryRows(state.derived.visible_memories, shellMode.expanded)}
            expanded={shellMode.expanded}
            pendingActionId={pendingActionId}
            selectedMemoryId={selectedMemoryId}
            onSelect={(memoryId) => {
              setSelectedMemoryId(memoryId);
              onMemorySelect?.(memoryId);
            }}
            onPin={(memoryId, value) => runAction({ type: "pin", memory_id: memoryId, value })}
            onSoften={(memoryId, value) => runAction({ type: "soften", memory_id: memoryId, value })}
            onHide={(memoryId) => runAction({ type: "hide", memory_id: memoryId })}
            onRestore={(memoryId) => runAction({ type: "restore", memory_id: memoryId })}
          />
        </div>
      ) : null}
    </div>
  );
}
