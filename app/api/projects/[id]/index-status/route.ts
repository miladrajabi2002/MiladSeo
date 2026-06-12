import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getIndexStatuses, inspectUrls } from "@/lib/inspection";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await getIndexStatuses(id));
  } catch (error) {
    return serverError(error);
  }
}

/** Runs live URL Inspection checks; body: { urlPaths?: string[] } */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  let urlPaths: string[] | undefined;
  try {
    const body = await request.json();
    if (Array.isArray(body?.urlPaths)) {
      urlPaths = body.urlPaths.filter((p: unknown) => typeof p === "string");
    }
  } catch {
    // empty body = check the stalest batch
  }

  try {
    return ok(await inspectUrls(id, urlPaths));
  } catch (error) {
    return serverError(error);
  }
}
