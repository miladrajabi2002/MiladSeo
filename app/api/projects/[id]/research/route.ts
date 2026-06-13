import { NextRequest, NextResponse } from "next/server";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { researchKeywords } from "@/lib/research";

export const dynamic = "force-dynamic";

/** GET expands a seed keyword into related queries (?q=...). */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  const seed = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!seed) return fail("A seed keyword (q) is required", "VALIDATION_ERROR", 422);

  try {
    return ok(await researchKeywords(id, seed));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    return fail(message, "RESEARCH_FAILED", 500);
  }
}
