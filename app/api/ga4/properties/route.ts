import { NextResponse } from "next/server";
import { fail, isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import { isGoogleConnected } from "@/lib/gsc";
import { listGa4Properties } from "@/lib/ga4";

export const dynamic = "force-dynamic";

/** Lists the connected Google account's GA4 properties for the picker. */
export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    if (!(await isGoogleConnected())) {
      return fail("Google account is not connected", "NOT_CONNECTED", 400);
    }
    return ok(await listGa4Properties());
  } catch (error) {
    return serverError(error);
  }
}
