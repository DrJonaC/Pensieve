"use client";

import { useLocale } from "@/lib/locale";
import { redactSensitiveText } from "@/lib/privacy";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  type DashboardAction,
  type DashboardState,
  type MemoryProvider
} from "@/lib/pensieve-dashboard-core";
import {
  type PensieveHostAdapter,
  type PensieveHostContext,
  type PensieveHostState
} from "@/lib/pensieve-host";
import { createMockPensieveHostAdapter } from "@/lib/pensieve-mock-host";
import { createPersistedMemoryProvider } from "@/lib/pensieve-persisted-provider";

type DashboardHostShellProps = {
  hostAdapter?: PensieveHostAdapter;
  provider?: MemoryProvider;
};

const fallbackHostState: PensieveHostState = {
  visible: true,
  expanded: false,
  width: 384,
  theme: "light"
};

export function DashboardHostShell({
  hostAdapter,
  provider
}: DashboardHostShellProps) {
  const { ui } = useLocale();
  const stableHostAdapter = useMemo(
    () => hostAdapter ?? createMockPensieveHostAdapter(),
    [hostAdapter]
  );
  const stableProvider = useMemo(
    () => provider ?? createPersistedMemoryProvider(),
    [provider]
  );
  const [context, setContext] = useState<PensieveHostContext | null>(null);
  const [hostState, setHostState] = useState<PensieveHostState>(fallbackHostState);
  const [isBooting, setIsBooting] = useState(true);
  const [hostError, setHostError] = useState<string | null>(null);
  const contextRef = useRef<PensieveHostContext | null>(null);
  const hostStateRef = useRef<PensieveHostState>(fallbackHostState);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    hostStateRef.current = hostState;
  }, [hostState]);

  useEffect(() => {
    let isActive = true;

    setIsBooting(true);
    setHostError(null);

    Promise.all([
      stableHostAdapter.getContext(),
      stableHostAdapter.getHostState()
    ])
      .then(([nextContext, nextHostState]) => {
        if (!isActive) {
          return;
        }

        setContext(nextContext);
        setHostState(nextHostState);
      })
      .catch((reason) => {
        if (!isActive) {
          return;
        }

        setHostError(reason instanceof Error ? reason.message : "Failed to boot the host adapter.");
      })
      .finally(() => {
        if (isActive) {
          setIsBooting(false);
        }
      });

    const unsubscribe = stableHostAdapter.subscribe((event) => {
      if (event.type === "host.context.updated") {
        setContext(event.payload.context);
        return;
      }

      if (event.type === "host.sidebar.updated") {
        setHostState((current) => ({
          ...current,
          ...event.payload.state
        }));
        return;
      }

      if (event.type === "host.visibility.changed") {
        setHostState((current) => ({
          ...current,
          visible: event.payload.visible
        }));
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [stableHostAdapter]);

  const handleActionComplete = useCallback(
    (action: DashboardAction) =>
      stableHostAdapter.emit({
        type: "plugin.memory.action",
        source: "plugin",
        payload: { action },
        timestamp: new Date().toISOString()
      }),
    [stableHostAdapter]
  );

  const handleExpandedChange = useCallback(
    (expanded: boolean) =>
      stableHostAdapter.emit({
        type: "plugin.expanded.changed",
        source: "plugin",
        payload: { expanded },
        timestamp: new Date().toISOString()
      }),
    [stableHostAdapter]
  );

  const handleMemorySelect = useCallback(
    (memoryId: string | null) =>
      stableHostAdapter.emit({
        type: "plugin.memory.selected",
        source: "plugin",
        payload: { memory_id: memoryId },
        timestamp: new Date().toISOString()
      }),
    [stableHostAdapter]
  );

  const handleReady = useCallback(
    (state: DashboardState) =>
      stableHostAdapter.emit({
        type: "plugin.panel.ready",
        source: "plugin",
        payload: {
          context: contextRef.current ?? {
            host_name: "unknown-host",
            session_id: "unknown-session",
            workspace_id: "unknown-workspace",
            query_mode: "query-free",
            timestamp: new Date().toISOString()
          },
          state: hostStateRef.current
        },
        timestamp: new Date().toISOString()
      }),
    [stableHostAdapter]
  );

  const handleShellError = useCallback(
    (message: string) =>
      stableHostAdapter.emit({
        type: "plugin.error",
        source: "plugin",
        payload: { message },
        timestamp: new Date().toISOString()
      }),
    [stableHostAdapter]
  );

  if (isBooting) {
    return (
      <div className="dashboard-panel rounded-[1.45rem] p-5">
        <p className="dashboard-kicker">{ui("Host")}</p>
        <h3 className="dashboard-section-title mt-1">{ui("Booting mock sidebar")}</h3>
        <p className="dashboard-subcopy mt-2">{ui("Initializing host context, sidebar state, and event bridge.")}</p>
      </div>
    );
  }

  if (hostError || !context) {
    return (
      <div className="dashboard-panel rounded-[1.45rem] border-[rgba(160,115,108,0.22)] p-5">
        <p className="dashboard-kicker">{ui("Host Error")}</p>
        <h3 className="dashboard-section-title mt-1">{ui("Adapter startup failed")}</h3>
        <p className="dashboard-subcopy mt-2">{hostError ? redactSensitiveText(hostError) : ui("Host context was not available.")}</p>
      </div>
    );
  }

  if (!hostState.visible) {
    return (
      <div className="dashboard-panel rounded-[1.45rem] p-5">
        <p className="dashboard-kicker">{ui("Host Hidden")}</p>
        <h3 className="dashboard-section-title mt-1">{ui("Sidebar collapsed by host")}</h3>
        <p className="dashboard-subcopy mt-2">
          {ui("The dashboard remains mounted, but the host has marked the sidebar as not currently visible.")}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: `${hostState.width}px`, width: "100%" }}>
      <DashboardShell
        provider={stableProvider}
        expanded={hostState.expanded}
        hostLabel={context.host_name}
        onActionComplete={handleActionComplete}
        onExpandedChange={handleExpandedChange}
        onMemorySelect={handleMemorySelect}
        onReady={handleReady}
        onShellError={handleShellError}
      />
    </div>
  );
}
