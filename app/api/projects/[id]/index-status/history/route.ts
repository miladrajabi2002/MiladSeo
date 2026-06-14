import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getIndexHistory } from "@/lib/inspection";

export const dynamic = "force-dynamic";

/** GET daily index-coverage trend (PASS/FAIL/NEUTRAL counts). */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam ? Number.parseInt(daysParam, 10) : 90;
  try {
    return ok(await getIndexHistory(id, Number.isFinite(days) ? days : 90));
  } catch (error) {
    return serverError(error);
  }
}
