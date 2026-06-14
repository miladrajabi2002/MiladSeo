import { NextRequest, NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { addCompetitor, getComparison, removeCompetitor } from "@/lib/competitors";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/** GET the head-to-head SERP comparison (tracked domains + latest positions). */
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await getComparison(id));
  } catch (error) {
    return serverError(error);
  }
}

interface AddBody {
  domain?: unknown;
  label?: unknown;
}

/** POST adds a competitor domain. */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const body = (await request.json()) as AddBody;
    const domain = typeof body.domain === "string" ? body.domain : "";
    const label = typeof body.label === "string" ? body.label : undefined;
    if (!domain.trim()) return fail("domain is required", "VALIDATION_ERROR", 422);
    return ok(await addCompetitor(id, domain, label), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add competitor";
    return fail(message, "ADD_FAILED", 400);
  }
}

/** DELETE removes a competitor (?competitorId=N). */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  const competitorId = parseId(request.nextUrl.searchParams.get("competitorId") ?? "");
  if (competitorId === null) {
    return fail("competitorId query param is required", "VALIDATION_ERROR", 422);
  }
  try {
    await removeCompetitor(id, competitorId);
    return ok({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove competitor";
    return fail(message, "DELETE_FAILED", 400);
  }
}
