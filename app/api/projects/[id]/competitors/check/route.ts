import { NextRequest, NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  unauthorized,
} from "@/lib/api";
import { checkSerp } from "@/lib/competitors";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** POST runs a SERP scrape for the given keywords (or top tracked keywords). */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  let keywords: string[] | undefined;
  try {
    const body = (await request.json()) as { keywords?: unknown };
    if (Array.isArray(body?.keywords)) {
      keywords = body.keywords.filter((k): k is string => typeof k === "string");
    }
  } catch {
    // no body = use top tracked keywords
  }

  try {
    return ok(await checkSerp(id, keywords));
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERP check failed";
    return fail(message, "SERP_CHECK_FAILED", 400);
  }
}
