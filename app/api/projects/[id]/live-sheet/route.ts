import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  unauthorized,
} from "@/lib/api";
import { pushLiveSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** POST creates/refreshes the Google Live Sheet and returns its URL. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const url = await pushLiveSheet(id);
    return ok({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Live Sheet update failed";
    return fail(message, "SHEET_FAILED", 500);
  }
}
