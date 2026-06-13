import { NextRequest, NextResponse } from "next/server";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { getGa4Summary } from "@/lib/ga4";

export const dynamic = "force-dynamic";

/** GET returns a GA4 summary for the project (?days=7|28|90). */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  const daysParam = Number(request.nextUrl.searchParams.get("days"));
  const days = [7, 28, 90].includes(daysParam) ? daysParam : 28;

  try {
    return ok(await getGa4Summary(id, days));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load GA4 data";
    return fail(message, "GA4_FAILED", 400);
  }
}
