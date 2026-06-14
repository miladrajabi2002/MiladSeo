import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { getPageSpeedHistory } from "@/lib/pagespeed";

export const dynamic = "force-dynamic";

/** GET daily PageSpeed history; optional ?url= and ?strategy= filters. */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  const sp = new URL(request.url).searchParams;
  const url = sp.get("url") ?? undefined;
  const strategyParam = sp.get("strategy");
  const strategy =
    strategyParam === "mobile" || strategyParam === "desktop" ? strategyParam : undefined;
  try {
    return ok(await getPageSpeedHistory(id, url, strategy));
  } catch (error) {
    return serverError(error);
  }
}
