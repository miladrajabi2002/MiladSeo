import { NextResponse } from "next/server";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { runAiAnalysis } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** POST runs an AI-powered SEO audit of the project's Search Console data. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const analysis = await runAiAnalysis(id);
    return ok(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return fail(message, "AI_ANALYSIS_FAILED", 500);
  }
}
