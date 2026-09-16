import {
  type DashboardAction,
  type DashboardActionResult,
  type DashboardMemoryRecord,
  type DashboardSnapshot,
  type MemoryProvider
} from "./pensieve-dashboard-core.ts";
import {
  type GovernanceBridgeStatus,
  type GovernanceReceipt,
  type GovernanceReportArtifact
} from "./pensieve-governance-bridge.ts";

import { notifyMemoryChange } from "./memory-events.ts";

type DashboardMemoryApiResponse = {
  ok: boolean;
  data?: {
    revision: string;
    snapshot: DashboardSnapshot;
    memories: DashboardMemoryRecord[];
    changed_memory?: DashboardMemoryRecord;
  };
  error?: string;
};

type PersistedProviderOptions = {
  endpoint?: string;
  governanceEndpoint?: string;
};

type GovernanceApiResponse = {
  ok: boolean;
  data?: {
    status?: GovernanceBridgeStatus;
    artifact?: GovernanceReportArtifact;
    receipt?: GovernanceReceipt;
  };
  error?: string;
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
  const governanceEndpoint = options.governanceEndpoint ?? "/api/governance-report";
  let revision: string | undefined;

  const requestGovernance = async (init?: RequestInit): Promise<GovernanceApiResponse["data"]> => {
    const response = await fetch(governanceEndpoint, init);
    const body = (await response.json()) as GovernanceApiResponse;

    if (!response.ok || !body.ok || !body.data) {
      throw new Error(body.error ?? "Governance bridge request failed.");
    }

    return body.data;
  };

  return {
    async getSnapshot(): Promise<DashboardSnapshot> {
      const data = await readDashboardMemoryData(await fetch(endpoint, { method: "GET" }));
      revision = data.revision;
      return data.snapshot;
    },

    async getMemories(): Promise<DashboardMemoryRecord[]> {
      const data = await readDashboardMemoryData(await fetch(endpoint, { method: "GET" }));
      revision = data.revision;
      return data.memories;
    },

    async applyAction(action: DashboardAction): Promise<DashboardActionResult> {
      const data = await readDashboardMemoryData(
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action, revision })
        })
      );

      revision = data.revision;
      notifyMemoryChange();
      return data;
    },

    async getGovernanceStatus(): Promise<GovernanceBridgeStatus> {
      const data = await requestGovernance();
      if (!data?.status) {
        throw new Error("Governance status response was incomplete.");
      }
      return data.status;
    },

    async generateGovernanceReport(): Promise<GovernanceReportArtifact> {
      const data = await requestGovernance({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "generate" })
      });
      if (!data?.artifact) {
        throw new Error("Governance report response was incomplete.");
      }
      return data.artifact;
    },

    async applyGovernanceReport(reportId: string): Promise<GovernanceReceipt> {
      const data = await requestGovernance({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "apply", report_id: reportId })
      });
      if (!data?.receipt) {
        throw new Error("Governance receipt response was incomplete.");
      }
      notifyMemoryChange();
      return data.receipt;
    }
  };
}
