import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { exploreSitemap } from "@/lib/sitemap";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** GET parses the project's sitemap(s) and flags tracked vs untracked URLs. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await exploreSitemap(id));
  } catch (error) {
    return serverError(error);
  }
}
