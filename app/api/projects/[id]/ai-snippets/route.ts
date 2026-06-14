import { NextResponse } from "next/server";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { suggestSnippets } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST generates improved title/meta suggestions for CTR opportunities. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await suggestSnippets(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suggestion failed";
    return fail(message, "AI_SNIPPETS_FAILED", 500);
  }
}
