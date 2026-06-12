import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  notFound,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getKeywordHistory } from "@/lib/insights";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string; keywordId: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  const keywordId = parseId(params.keywordId);
  if (id === null || keywordId === null) {
    return fail("Invalid id", "INVALID_ID", 422);
  }
  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam === "90" ? 90 : 30;
  try {
    const history = await getKeywordHistory(id, keywordId, days);
    if (!history) return notFound("Keyword");
    return ok(history);
  } catch (error) {
    return serverError(error);
  }
}
