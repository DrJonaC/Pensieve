"use client";

import { useLocale } from "@/lib/locale";

import { useEffect, useMemo, useState } from "react";
import { DashboardHostShell } from "@/components/dashboard/DashboardHostShell";
import {
  HOST_CAPTURE_LIMIT,
  shouldRefreshCaptureDisplay
} from "@/lib/pensieve-host-preview";
import { createMockPensieveHostAdapter } from "@/lib/pensieve-mock-host";

export function DashboardHostPreview() {
  const { ui, t } = useLocale();
  const hostAdapter = useMemo(() => createMockPensieveHostAdapter(), []);
  const [workspaceIndex, setWorkspaceIndex] = useState(1);
  const [eventCount, setEventCount] = useState(0);
  const [hostVisible, setHostVisible] = useState(true);
  const [hostExpanded, setHostExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = hostAdapter.subscribe(() => {
      const nextCount = hostAdapter.getEventCount();

      if (shouldRefreshCaptureDisplay(nextCount) || hostAdapter.isCaptureLimitReached()) {
        setEventCount(nextCount);
      }
    });

    return unsubscribe;
  }, [hostAdapter]);

  const refreshEventCount = () => {
    setEventCount(hostAdapter.getEventCount());
  };

  return (
    <div className="space-y-4">
      <div className="dashboard-panel rounded-[1.45rem] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="dashboard-kicker">{ui("Mock Host")}</p>
            <h3 className="dashboard-section-title mt-1">{ui("Sidebar adapter preview")}</h3>
            <p className="dashboard-subcopy mt-2 max-w-[28rem]">
              {ui("This local host simulates sidebar visibility, expansion, workspace context, and event capture without coupling Pensieve to any specific runtime.")}
            </p>
          </div>
          <span className="dashboard-status-pill">
            {hostAdapter.isCaptureLimitReached() ? ui("Capture limit reached") : ui("Capturing")}
          </span>
        </div>

        <p className="dashboard-meta-note mt-3">
          {hostAdapter.isCaptureLimitReached()
            ? t(`${eventCount} events buffered. Capture stops automatically at ${HOST_CAPTURE_LIMIT}.`, `已缓存 ${eventCount} 个事件。达到 ${HOST_CAPTURE_LIMIT} 个时自动停止捕获。`)
            : t(`${eventCount} events buffered. Display refreshes every 500 captured events.`, `已缓存 ${eventCount} 个事件。每捕获 500 个事件刷新显示。`)}
        </p>

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
            {hostVisible ? ui("Hide Sidebar") : ui("Show Sidebar")}
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
            {hostExpanded ? ui("Compact Host") : ui("Expand Host")}
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
            {ui("Rotate Workspace")}
          </button>
          <button
            type="button"
            className="dashboard-action-button"
            onClick={() => {
              hostAdapter.clearEvents();
              refreshEventCount();
            }}
          >
            {ui("Clear Event Log")}
          </button>
          <button
            type="button"
            className="dashboard-action-button dashboard-action-button--accent"
            onClick={refreshEventCount}
          >
            {ui("Refresh Event Count")}
          </button>
        </div>
      </div>

      <DashboardHostShell hostAdapter={hostAdapter} />
    </div>
  );
}
