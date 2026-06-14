import { NextResponse } from "next/server";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { clusterKeywords } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST groups the project's keywords into topic clusters via AI. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await clusterKeywords(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Clustering failed";
    return fail(message, "AI_CLUSTER_FAILED", 500);
  }
}
