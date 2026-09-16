import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/request-safety";
import { safeErrorMessage } from "@/lib/privacy-server";

import {
  getGovernanceBridgeStatus,
  readGovernanceReport,
  writeGovernanceReceipt,
  writeGovernanceReport
} from "@/lib/pensieve-governance-repository";
import {
  readPensieveRepository,
  mutateMemoryRepository,
  repositoryRevision
} from "@/lib/pensieve-file-repository";
import { loadBaseMemories } from "@/lib/memory-store";
import {
  applyGovernanceReportToRecords,
  toDashboardMemory
} from "@/lib/pensieve-records";

type GovernanceRequestBody = {
  operation?: unknown;
  report_id?: unknown;
};

function readDashboardMemories() {
  return readPensieveRepository().then((records) => records.map(toDashboardMemory));
}

function readBaselineMemories() {
  return loadBaseMemories().map(toDashboardMemory);
}

export async function GET() {
  try {
    const status = await getGovernanceBridgeStatus({
      currentMemories: await readDashboardMemories(),
      baselineMemories: readBaselineMemories()
    });

    return NextResponse.json({ ok: true, data: { status } });
  } catch (error) {
    console.error("[GOVERNANCE STATUS ERROR]", safeErrorMessage(error, "Failed to read governance status."));
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error, "Failed to read governance status.") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const body = (await request.json()) as GovernanceRequestBody;

    if (body.operation === "generate") {
      const artifact = await writeGovernanceReport({
        currentMemories: await readDashboardMemories(),
        baselineMemories: readBaselineMemories(),
        provider: "local-file"
      });

      return NextResponse.json({ ok: true, data: { artifact } });
    }

    if (body.operation === "apply" && typeof body.report_id === "string") {
      const report = await readGovernanceReport(body.report_id);
      const records = await readPensieveRepository();
      const nextRecords = applyGovernanceReportToRecords(records, report);

      await mutateMemoryRepository(repositoryRevision(records), () => nextRecords);

      const receipt = await writeGovernanceReceipt({
        report,
        memories: nextRecords.map(toDashboardMemory)
      });

      return NextResponse.json({ ok: true, data: { receipt } });
    }

    return NextResponse.json({ ok: false, error: "Invalid governance operation." }, { status: 400 });
  } catch (error) {
    console.error("[GOVERNANCE REPORT ERROR]", safeErrorMessage(error, "Governance operation failed."));
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error, "Governance operation failed.") },
      { status: 500 }
    );
  }
}
