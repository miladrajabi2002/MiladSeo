import { NextResponse } from "next/server";
import { google } from "googleapis";
import { isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import { getAuthorizedClient, isGoogleConnected } from "@/lib/gsc";
import { fail } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Returns the list of Search Console properties the connected account can access. */
export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    if (!(await isGoogleConnected())) {
      return fail("Google account is not connected", "NOT_CONNECTED", 400);
    }
    const auth = await getAuthorizedClient();
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const res = await searchconsole.sites.list();
    const sites = (res.data.siteEntry ?? []).map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel,
    }));
    return ok(sites);
  } catch (error) {
    return serverError(error);
  }
}
