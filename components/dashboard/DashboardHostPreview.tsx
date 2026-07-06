"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHostShell } from "@/components/dashboard/DashboardHostShell";
import { createMockPensieveHostAdapter } from "@/lib/pensieve-mock-host";

export function DashboardHostPreview() {
  const hostAdapter = useMemo(() => createMockPensieveHostAdapter(), []);
  const [workspaceIndex, setWorkspaceIndex] = useState(1);
  const [eventCount, setEventCount] = useState(0);
  const [hostVisible, setHostVisible] = useState(true);
  const [hostExpanded, setHostExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = hostAdapter.subscribe(() => {
      setEventCount(hostAdapter.getEvents().length);
    });

    return unsubscribe;
  }, [hostAdapter]);

  const refreshEventCount = () => {
    setEventCount(hostAdapter.getEvents().length);
  };

  return (
    <div className="space-y-4">
      <div className="dashboard-panel rounded-[1.45rem] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="dashboard-kicker">Mock Host</p>
            <h3 className="dashboard-section-title mt-1">Sidebar adapter preview</h3>
            <p className="dashboard-subcopy mt-2 max-w-[28rem]">
              This local host simulates sidebar visibility, expansion, workspace context, and event capture without
              coupling Pensieve to any specific runtime.
            </p>
          </div>
          <span className="dashboard-status-pill">{eventCount} events captured</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            className="dashboard-action-button"
            onClick={() => {
              const nextVisible = !hostVisible;
              setHostVisible(nextVisible);
              hostAdapter.setVisible(nextVisible);
            }}
          >
            {hostVisible ? "Hide Sidebar" : "Show Sidebar"}
          </button>
          <button
            type="button"
            className="dashboard-action-button"
            onClick={() => {
              const nextExpanded = !hostExpanded;
              setHostExpanded(nextExpanded);
              hostAdapter.setHostState({
                expanded: nextExpanded,
                width: nextExpanded ? 672 : 384
              });
            }}
          >
            {hostExpanded ? "Compact Host" : "Expand Host"}
          </button>
          <button
            type="button"
            className="dashboard-action-button"
            onClick={() => {
              const nextIndex = workspaceIndex + 1;
              setWorkspaceIndex(nextIndex);
              hostAdapter.setContext({
                workspace_id: `pensieve-workspace-${nextIndex}`,
                session_id: `session-local-preview-${nextIndex}`
              });
            }}
          >
            Rotate Workspace
          </button>
          <button
            type="button"
            className="dashboard-action-button"
            onClick={() => {
              hostAdapter.clearEvents();
              refreshEventCount();
            }}
          >
            Clear Event Log
          </button>
          <button
            type="button"
            className="dashboard-action-button dashboard-action-button--accent"
            onClick={refreshEventCount}
          >
            Refresh Event Count
          </button>
        </div>
      </div>

      <DashboardHostShell hostAdapter={hostAdapter} />
    </div>
  );
}
