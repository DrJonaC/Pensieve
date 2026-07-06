import { type DashboardAction } from "./pensieve-dashboard-core.ts";

export type PensieveQueryMode = "query-free" | "query-based";
export type PensieveHostTheme = "light" | "dark" | "system";

export type PensieveHostContext = {
  host_name: string;
  session_id: string;
  workspace_id: string;
  user_id?: string;
  query_mode: PensieveQueryMode;
  timestamp: string;
};

export type PensieveHostState = {
  visible: boolean;
  expanded: boolean;
  width: number;
  theme?: PensieveHostTheme;
};

export type PensieveHostEvent =
  | {
      type: "host.context.updated";
      source: "host";
      payload: { context: PensieveHostContext };
      timestamp: string;
    }
  | {
      type: "host.sidebar.updated";
      source: "host";
      payload: { state: Partial<PensieveHostState> };
      timestamp: string;
    }
  | {
      type: "host.visibility.changed";
      source: "host";
      payload: { visible: boolean };
      timestamp: string;
    }
  | {
      type: "plugin.panel.ready";
      source: "plugin";
      payload: {
        context: PensieveHostContext;
        state: PensieveHostState;
      };
      timestamp: string;
    }
  | {
      type: "plugin.memory.selected";
      source: "plugin";
      payload: { memory_id: string | null };
      timestamp: string;
    }
  | {
      type: "plugin.memory.action";
      source: "plugin";
      payload: { action: DashboardAction };
      timestamp: string;
    }
  | {
      type: "plugin.expanded.changed";
      source: "plugin";
      payload: { expanded: boolean };
      timestamp: string;
    }
  | {
      type: "plugin.error";
      source: "plugin";
      payload: { message: string };
      timestamp: string;
    };

export type PensieveHostListener = (event: PensieveHostEvent) => void;

export interface PensieveHostAdapter {
  getContext(): Promise<PensieveHostContext> | PensieveHostContext;
  getHostState(): Promise<PensieveHostState> | PensieveHostState;
  subscribe(listener: PensieveHostListener): () => void;
  emit(event: PensieveHostEvent): Promise<void> | void;
}

