import {
  createDashboardState,
  type DashboardAction,
  type DashboardActionResult,
  type DashboardMemoryRecord,
  type DashboardMemoryStatus
} from "./pensieve-dashboard-core.ts";
import { type PersistedMemoryRecord } from "./memory-store.ts";

export function mapPersistedStatus(status: PersistedMemoryRecord["status"]): DashboardMemoryStatus {
  if (status === "forgotten") {
    return "hidden";
  }

  return status;
}

export function mapDashboardStatus(status: DashboardMemoryStatus): PersistedMemoryRecord["status"] {
  if (status === "hidden") {
    return "forgotten";
  }

  return status;
}

export function toDashboardMemory(memory: PersistedMemoryRecord): DashboardMemoryRecord {
  return {
    id: memory.id,
    content: memory.content,
    keywords: [...memory.keywords],
    priority_score: memory.base_importance,
    risk_level: memory.risk_level,
    status: mapPersistedStatus(memory.status),
    pinned: memory.pinned,
    created_at: memory.created_at,
    updated_at: memory.updated_at ?? memory.last_activated,
    last_activated: memory.last_activated,
    activation_count: memory.activation_count,
    info_type: memory.info_type,
    origin_context: memory.origin_context,
    origin_tp: memory.origin_tp
  };
}

export function toDashboardActionResult(records: readonly PersistedMemoryRecord[]): DashboardActionResult {
  const state = createDashboardState(records.map(toDashboardMemory));

  return {
    snapshot: state.snapshot,
    memories: state.memories
  };
}

export function applyDashboardActionToRecords(
  records: readonly PersistedMemoryRecord[],
  action: DashboardAction
): {
  changedRecord: PersistedMemoryRecord;
  result: DashboardActionResult;
  records: PersistedMemoryRecord[];
} {
  const updatedAt = new Date().toISOString();
  let changedRecord: PersistedMemoryRecord | null = null;

  const nextRecords = records.map((record) => {
    if (record.id !== action.memory_id) {
      return {
        ...record,
        keywords: [...record.keywords]
      };
    }

    if (action.type === "pin") {
      changedRecord = {
        ...record,
        pinned: action.value,
        updated_at: updatedAt,
        keywords: [...record.keywords]
      };
      return changedRecord;
    }

    if (action.type === "soften") {
      changedRecord = {
        ...record,
        status: action.value ? "softened" : "active",
        updated_at: updatedAt,
        keywords: [...record.keywords]
      };
      return changedRecord;
    }

    if (action.type === "hide") {
      changedRecord = {
        ...record,
        pinned: false,
        status: "forgotten",
        updated_at: updatedAt,
        keywords: [...record.keywords]
      };
      return changedRecord;
    }

    changedRecord = {
      ...record,
      status: "active",
      updated_at: updatedAt,
      keywords: [...record.keywords]
    };
    return changedRecord;
  });

  if (!changedRecord) {
    throw new Error(`Memory ${action.memory_id} was not found.`);
  }

  const result = toDashboardActionResult(nextRecords);

  return {
    changedRecord,
    result: {
      ...result,
      changed_memory: toDashboardMemory(changedRecord)
    },
    records: nextRecords
  };
}

