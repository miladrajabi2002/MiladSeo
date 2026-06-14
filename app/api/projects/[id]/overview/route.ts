import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getOverviewStats } from "@/lib/rankings";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam ? Number.parseInt(daysParam, 10) : undefined;
  try {
    return ok(await getOverviewStats(id, days));
  } catch (error) {
    return serverError(error);
  }
}
