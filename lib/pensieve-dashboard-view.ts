import { type DashboardMemoryRecord } from "./pensieve-dashboard-core.ts";

export type DashboardShellMode = {
  keywordsLimit: number;
  expanded: boolean;
  modeLabel: "overview" | "inspection";
};

export function getVisibleMemoryRows(
  memories: readonly DashboardMemoryRecord[],
  expanded: boolean
): DashboardMemoryRecord[] {
  if (expanded) {
    return [...memories];
  }

  return [...memories].slice(0, 5);
}

export function getDashboardShellMode(expanded: boolean): DashboardShellMode {
  return expanded
    ? {
        keywordsLimit: 8,
        expanded: true,
        modeLabel: "inspection"
      }
    : {
        keywordsLimit: 5,
        expanded: false,
        modeLabel: "overview"
      };
}
