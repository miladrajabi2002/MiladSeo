import { NextRequest, NextResponse } from "next/server";
import { fail, isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import { getSyncWindow, setSyncWindow } from "@/lib/gsc";

export const dynamic = "force-dynamic";

/** GET the configured sync window (days each sync pulls from GSC). */
export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    return ok({ days: await getSyncWindow() });
  } catch (error) {
    return serverError(error);
  }
}

interface Body {
  days?: unknown;
}

/** PUT updates the sync window. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const body = (await request.json()) as Body;
    const days = typeof body.days === "number" ? body.days : Number(body.days);
    if (!Number.isFinite(days) || days < 1) {
      return fail("days must be a positive number", "VALIDATION_ERROR", 422);
    }
    return ok({ days: await setSyncWindow(days) });
  } catch (error) {
    return serverError(error);
  }
}
