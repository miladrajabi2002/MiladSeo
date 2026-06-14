import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  unauthorized,
} from "@/lib/api";
import { isSyncing, syncProject } from "@/lib/gsc";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST triggers a manual Search Console sync for the project.
 * Optional body { days } performs a one-off deep sync over that many days
 * (otherwise the configured sync window is used).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  if (isSyncing(id)) {
    return fail("A sync is already running for this project", "SYNC_IN_PROGRESS", 409);
  }

  let days: number | undefined;
  try {
    const body = (await request.json()) as { days?: unknown };
    if (typeof body?.days === "number" && Number.isFinite(body.days)) {
      days = body.days;
    }
  } catch {
    // no body = use configured window
  }

  try {
    const result = await syncProject(id, days);
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return fail(message, "SYNC_FAILED", 500);
  }
}
