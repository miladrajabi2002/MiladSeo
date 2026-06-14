import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getTraffic } from "@/lib/insights";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  const daysParam = new URL(request.url).searchParams.get("days");
  const parsed = daysParam ? Number.parseInt(daysParam, 10) : 30;
  const days = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 480) : 30;
  try {
    return ok(await getTraffic(id, days));
  } catch (error) {
    return serverError(error);
  }
}
