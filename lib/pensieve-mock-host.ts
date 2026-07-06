import {
  type PensieveHostAdapter,
  type PensieveHostContext,
  type PensieveHostEvent,
  type PensieveHostListener,
  type PensieveHostState
} from "./pensieve-host.ts";

type MockHostOptions = {
  context?: Partial<PensieveHostContext>;
  state?: Partial<PensieveHostState>;
};

export interface MockPensieveHostAdapter extends PensieveHostAdapter {
  clearEvents(): void;
  getEvents(): PensieveHostEvent[];
  setContext(context: Partial<PensieveHostContext>): void;
  setHostState(state: Partial<PensieveHostState>): void;
  setVisible(visible: boolean): void;
}

function createDefaultContext(): PensieveHostContext {
  return {
    host_name: "mock-host",
    session_id: "session-local-preview",
    workspace_id: "pensieve-workspace",
    user_id: "local-user",
    query_mode: "query-free",
    timestamp: new Date().toISOString()
  };
}

function createDefaultState(): PensieveHostState {
  return {
    visible: true,
    expanded: false,
    width: 384,
    theme: "light"
  };
}

export function createMockPensieveHostAdapter(
  options: MockHostOptions = {}
): MockPensieveHostAdapter {
  let context: PensieveHostContext = {
    ...createDefaultContext(),
    ...options.context
  };
  let state: PensieveHostState = {
    ...createDefaultState(),
    ...options.state
  };
  const events: PensieveHostEvent[] = [];
  const listeners = new Set<PensieveHostListener>();

  const dispatch = (event: PensieveHostEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  return {
    clearEvents() {
      events.length = 0;
    },
    getContext() {
      return context;
    },
    getEvents() {
      return [...events];
    },
    getHostState() {
      return state;
    },
    emit(event) {
      events.push(event);
      dispatch(event);

      if (event.type === "plugin.expanded.changed") {
        state = {
          ...state,
          expanded: event.payload.expanded,
          width: event.payload.expanded ? 672 : 384
        };

        dispatch({
          type: "host.sidebar.updated",
          source: "host",
          payload: {
            state: {
              expanded: state.expanded,
              width: state.width
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    },
    setContext(nextContext) {
      context = {
        ...context,
        ...nextContext,
        timestamp: new Date().toISOString()
      };

      dispatch({
        type: "host.context.updated",
        source: "host",
        payload: { context },
        timestamp: context.timestamp
      });
    },
    setHostState(nextState) {
      state = {
        ...state,
        ...nextState
      };

      dispatch({
        type: "host.sidebar.updated",
        source: "host",
        payload: { state: nextState },
        timestamp: new Date().toISOString()
      });
    },
    setVisible(visible) {
      state = {
        ...state,
        visible
      };

      dispatch({
        type: "host.visibility.changed",
        source: "host",
        payload: { visible },
        timestamp: new Date().toISOString()
      });
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }
  };
}
