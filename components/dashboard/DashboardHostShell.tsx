"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
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

  if (isBooting) {
    return (
      <div className="dashboard-panel rounded-[1.45rem] p-5">
        <p className="dashboard-kicker">Host</p>
        <h3 className="dashboard-section-title mt-1">Booting mock sidebar</h3>
        <p className="dashboard-subcopy mt-2">Initializing host context, sidebar state, and event bridge.</p>
      </div>
    );
  }

  if (hostError || !context) {
    return (
      <div className="dashboard-panel rounded-[1.45rem] border-[rgba(160,115,108,0.22)] p-5">
        <p className="dashboard-kicker">Host Error</p>
        <h3 className="dashboard-section-title mt-1">Adapter startup failed</h3>
        <p className="dashboard-subcopy mt-2">{hostError ?? "Host context was not available."}</p>
      </div>
    );
  }

  if (!hostState.visible) {
    return (
      <div className="dashboard-panel rounded-[1.45rem] p-5">
        <p className="dashboard-kicker">Host Hidden</p>
        <h3 className="dashboard-section-title mt-1">Sidebar collapsed by host</h3>
        <p className="dashboard-subcopy mt-2">
          The dashboard remains mounted, but the host has marked the sidebar as not currently visible.
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
        onActionComplete={(action) =>
          stableHostAdapter.emit({
            type: "plugin.memory.action",
            source: "plugin",
            payload: { action },
            timestamp: new Date().toISOString()
          })
        }
        onExpandedChange={(expanded) =>
          stableHostAdapter.emit({
            type: "plugin.expanded.changed",
            source: "plugin",
            payload: { expanded },
            timestamp: new Date().toISOString()
          })
        }
        onMemorySelect={(memoryId) =>
          stableHostAdapter.emit({
            type: "plugin.memory.selected",
            source: "plugin",
            payload: { memory_id: memoryId },
            timestamp: new Date().toISOString()
          })
        }
        onReady={() =>
          stableHostAdapter.emit({
            type: "plugin.panel.ready",
            source: "plugin",
            payload: {
              context,
              state: hostState
            },
            timestamp: new Date().toISOString()
          })
        }
        onShellError={(message) =>
          stableHostAdapter.emit({
            type: "plugin.error",
            source: "plugin",
            payload: { message },
            timestamp: new Date().toISOString()
          })
        }
      />
    </div>
  );
}
