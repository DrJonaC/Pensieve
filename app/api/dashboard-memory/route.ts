import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/request-safety";
import { safeErrorMessage } from "@/lib/privacy-server";
import {
  readPensieveRepository,
  applyPensieveRepositoryAction,
  getPensieveRepositoryPath,
  repositoryRevision,
  RepositoryConflictError
} from "@/lib/pensieve-file-repository";
import { toDashboardActionResult } from "@/lib/pensieve-records";
import { type DashboardAction } from "@/lib/pensieve-dashboard-core";

type DashboardMemoryRequestBody = {
  action?: unknown;
  revision?: unknown;
};

function isDashboardAction(value: unknown): value is DashboardAction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DashboardAction>;

  if (
    candidate.type === "pin" &&
    typeof candidate.memory_id === "string" &&
    typeof candidate.value === "boolean"
  ) {
    return true;
  }

  if (
    candidate.type === "soften" &&
    typeof candidate.memory_id === "string" &&
    typeof candidate.value === "boolean"
  ) {
    return true;
  }

  return (
    (candidate.type === "hide" || candidate.type === "restore") &&
    typeof candidate.memory_id === "string"
  );
}

export async function GET() {
  try {
    const records = await readPensieveRepository();
    const result = toDashboardActionResult(records);

    return NextResponse.json({
      ok: true,
      data: { ...result, revision: repositoryRevision(records) },
      meta: {
        repository_path: getPensieveRepositoryPath(),
        storage: "local-file"
      }
    });
  } catch (error) {
    console.error("[DASHBOARD MEMORY GET ERROR]", safeErrorMessage(error, "Failed to read dashboard memory repository."));
    return NextResponse.json(
      {
        ok: false,
        error: safeErrorMessage(error, "Failed to read dashboard memory repository.")
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const body = (await request.json()) as DashboardMemoryRequestBody;

    if (!isDashboardAction(body.action) || typeof body.revision !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid dashboard memory action." }, { status: 400 });
    }

    const next = await applyPensieveRepositoryAction(body.action, undefined, body.revision);

    return NextResponse.json({
      ok: true,
      data: { ...next.result, revision: repositoryRevision(next.records) },
      meta: {
        repository_path: getPensieveRepositoryPath(),
        storage: "local-file"
      }
    });
  } catch (error) {
    console.error("[DASHBOARD MEMORY POST ERROR]", safeErrorMessage(error, "Failed to update dashboard memory repository."));
    return NextResponse.json(
      {
        ok: false,
        error: safeErrorMessage(error, "Failed to update dashboard memory repository.")
      },
      { status: error instanceof RepositoryConflictError ? 409 : 500 }
    );
  }
}

