import {
  type DashboardAction,
  type DashboardActionResult,
  type DashboardMemoryRecord,
  type DashboardSnapshot,
  type MemoryProvider
} from "./pensieve-dashboard-core.ts";

type DashboardMemoryApiResponse = {
  ok: boolean;
  data?: {
    snapshot: DashboardSnapshot;
    memories: DashboardMemoryRecord[];
    changed_memory?: DashboardMemoryRecord;
  };
  error?: string;
};

type PersistedProviderOptions = {
  endpoint?: string;
};

async function readJsonResponse(response: Response): Promise<DashboardMemoryApiResponse> {
  const body = (await response.json()) as DashboardMemoryApiResponse;

  if (!response.ok || !body.ok || !body.data) {
    throw new Error(body.error ?? "Dashboard memory request failed.");
  }

  return body;
}

async function readDashboardMemoryData(response: Response) {
  const body = await readJsonResponse(response);

  if (!body.data) {
    throw new Error("Dashboard memory response did not include data.");
  }

  return body.data;
}

export function createPersistedMemoryProvider(
  options: PersistedProviderOptions = {}
): MemoryProvider {
  const endpoint = options.endpoint ?? "/api/dashboard-memory";

  return {
    async getSnapshot(): Promise<DashboardSnapshot> {
      const data = await readDashboardMemoryData(await fetch(endpoint, { method: "GET" }));
      return data.snapshot;
    },

    async getMemories(): Promise<DashboardMemoryRecord[]> {
      const data = await readDashboardMemoryData(await fetch(endpoint, { method: "GET" }));
      return data.memories;
    },

    async applyAction(action: DashboardAction): Promise<DashboardActionResult> {
      const data = await readDashboardMemoryData(
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action })
        })
      );

      return data;
    }
  };
}
