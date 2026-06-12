import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getComparison } from "@/lib/insights";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  const range =
    new URL(request.url).searchParams.get("range") === "month"
      ? ("month" as const)
      : ("week" as const);
  try {
    return ok(await getComparison(id, range));
  } catch (error) {
    return serverError(error);
  }
}
