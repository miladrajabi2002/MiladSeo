import { NextRequest, NextResponse } from "next/server";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { assist, type AssistArea } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const AREAS: AssistArea[] = ["overview", "insights", "health", "onpage"];

interface Body {
  area?: unknown;
  question?: unknown;
  url?: unknown;
}

/** POST runs a focused AI assist for one tab's data. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  const body = (await request.json()) as Body;
  const area = body.area;
  if (typeof area !== "string" || !AREAS.includes(area as AssistArea)) {
    return fail("Invalid area", "VALIDATION_ERROR", 422);
  }
  const question = typeof body.question === "string" ? body.question : undefined;
  const url = typeof body.url === "string" ? body.url : undefined;

  try {
    const answer = await assist(area as AssistArea, id, question, url);
    return ok({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI assist failed";
    return fail(message, "AI_ASSIST_FAILED", 500);
  }
}
