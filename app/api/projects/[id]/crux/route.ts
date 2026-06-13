import { NextRequest, NextResponse } from "next/server";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { getCruxHistory } from "@/lib/crux";

export const dynamic = "force-dynamic";

/** GET returns real-user Core Web Vitals history (?formFactor=PHONE|DESKTOP). */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  const ff = request.nextUrl.searchParams.get("formFactor");
  const formFactor = ff === "DESKTOP" ? "DESKTOP" : "PHONE";

  try {
    return ok(await getCruxHistory(id, formFactor));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load field data";
    return fail(message, "CRUX_FAILED", 400);
  }
}
