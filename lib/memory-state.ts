import {
  buildDormantActivationResult,
  createDefaultMemoryModifiers,
  simulateActivation,
  type ActivationResult,
  type MemoryModifierMap,
  type MemoryUnit
} from "./memory.ts";

export type SessionSnapshot = {
  modifiers: MemoryModifierMap;
  query: string;
  result: ActivationResult;
};

export type MemorySessionState = {
  modifiers: MemoryModifierMap;
  history: SessionSnapshot[];
  query: string;
  result: ActivationResult;
};

function cloneModifiers(modifiers: MemoryModifierMap): MemoryModifierMap {
  return Object.fromEntries(
    Object.entries(modifiers).map(([memoryId, modifier]) => [
      memoryId,
      {
        pinned: modifier.pinned,
        status: modifier.status
      }
    ])
  );
}

function cloneSnapshot(snapshot: SessionSnapshot): SessionSnapshot {
  return {
    modifiers: cloneModifiers(snapshot.modifiers),
    query: snapshot.query,
    result: {
      ...snapshot.result,
      memories: [...snapshot.result.memories],
      tokens: [...snapshot.result.tokens],
      heatmap: [...snapshot.result.heatmap],
      hiddenMemoryIds: [...snapshot.result.hiddenMemoryIds],
      reasons: { ...snapshot.result.reasons }
    }
  };
}

function createSnapshot(state: MemorySessionState): SessionSnapshot {
  return cloneSnapshot({
    modifiers: state.modifiers,
    query: state.query,
    result: state.result
  });
}

function recalculateResult(
  baseMemories: readonly MemoryUnit[],
  modifiers: MemoryModifierMap,
  query: string
): ActivationResult {
  return query.trim()
    ? simulateActivation(query, baseMemories, modifiers)
    : buildDormantActivationResult(baseMemories, modifiers, query);
}

function applyModifierMutation(
  state: MemorySessionState,
  baseMemories: readonly MemoryUnit[],
  transform: (modifiers: MemoryModifierMap) => MemoryModifierMap
): MemorySessionState {
  const snapshot = createSnapshot(state);
  const nextModifiers = transform(cloneModifiers(state.modifiers));

  return {
    modifiers: nextModifiers,
    history: [...state.history, snapshot],
    query: state.query,
    result: recalculateResult(baseMemories, nextModifiers, state.query)
  };
}

export function createInitialSessionState(baseMemories: readonly MemoryUnit[], initialQuery = ""): MemorySessionState {
  const modifiers = createDefaultMemoryModifiers(baseMemories);

  return {
    modifiers,
    history: [],
    query: initialQuery,
    result: buildDormantActivationResult(baseMemories, modifiers, initialQuery)
  };
}

export function setSessionQuery(state: MemorySessionState, query: string): MemorySessionState {
  return {
    ...state,
    query
  };
}

export function applyQueryResult(
  state: MemorySessionState,
  query: string,
  result: ActivationResult
): MemorySessionState {
  return {
    ...state,
    query,
    result
  };
}

export function toggleSoftened(
  state: MemorySessionState,
  baseMemories: readonly MemoryUnit[],
  memoryId: string
): MemorySessionState {
  return applyModifierMutation(state, baseMemories, (modifiers) => {
    const current = modifiers[memoryId];
    modifiers[memoryId] = {
      ...current,
      status: current.status === "softened" ? "active" : "softened"
    };
    return modifiers;
  });
}

export function togglePinned(
  state: MemorySessionState,
  baseMemories: readonly MemoryUnit[],
  memoryId: string
): MemorySessionState {
  return applyModifierMutation(state, baseMemories, (modifiers) => {
    const current = modifiers[memoryId];
    modifiers[memoryId] = {
      ...current,
      pinned: !current.pinned
    };
    return modifiers;
  });
}

export function markForgotten(
  state: MemorySessionState,
  baseMemories: readonly MemoryUnit[],
  memoryId: string
): MemorySessionState {
  return applyModifierMutation(state, baseMemories, (modifiers) => {
    const current = modifiers[memoryId];
    modifiers[memoryId] = {
      ...current,
      pinned: false,
      status: "forgotten"
    };
    return modifiers;
  });
}

export function restoreForgottenMemories(
  state: MemorySessionState,
  baseMemories: readonly MemoryUnit[]
): MemorySessionState {
  return applyModifierMutation(state, baseMemories, (modifiers) => {
    Object.entries(modifiers).forEach(([memoryId, modifier]) => {
      if (modifier.status === "forgotten") {
        modifiers[memoryId] = {
          ...modifier,
          status: "active"
        };
      }
    });
    return modifiers;
  });
}

export function resetSessionView(
  state: MemorySessionState,
  baseMemories: readonly MemoryUnit[]
): MemorySessionState {
  const snapshot = createSnapshot(state);
  const modifiers = createDefaultMemoryModifiers(baseMemories);

  return {
    modifiers,
    history: [...state.history, snapshot],
    query: state.query,
    result: buildDormantActivationResult(baseMemories, modifiers, state.query)
  };
}

export function undoLastSessionAction(state: MemorySessionState): MemorySessionState {
  const previous = state.history[state.history.length - 1];
  if (!previous) {
    return state;
  }

  return {
    modifiers: cloneModifiers(previous.modifiers),
    query: previous.query,
    result: {
      ...previous.result,
      memories: [...previous.result.memories],
      tokens: [...previous.result.tokens],
      heatmap: [...previous.result.heatmap],
      hiddenMemoryIds: [...previous.result.hiddenMemoryIds],
      reasons: { ...previous.result.reasons }
    },
    history: state.history.slice(0, -1)
  };
}
