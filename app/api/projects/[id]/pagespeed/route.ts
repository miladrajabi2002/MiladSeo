import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getPageSpeedResults, runPageSpeed } from "@/lib/pagespeed";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await getPageSpeedResults(id));
  } catch (error) {
    return serverError(error);
  }
}

/** Runs live PageSpeed audits; body: { urlPaths: string[], strategy?: "mobile" | "desktop" } */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  let body: { urlPaths?: unknown; strategy?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", "INVALID_BODY", 422);
  }
  if (!Array.isArray(body.urlPaths) || body.urlPaths.length === 0) {
    return fail("urlPaths is required", "INVALID_BODY", 422);
  }
  const urlPaths = body.urlPaths.filter(
    (p): p is string => typeof p === "string"
  );
  const strategy = body.strategy === "desktop" ? "desktop" : "mobile";

  try {
    return ok(await runPageSpeed(id, urlPaths, strategy));
  } catch (error) {
    return serverError(error);
  }
}
