import { NextResponse } from "next/server";
import { google } from "googleapis";
import { isAuthenticated, ok, serverError, unauthorized, fail } from "@/lib/api";
import { getAuthorizedClient, isGoogleConnected } from "@/lib/gsc";

export const dynamic = "force-dynamic";

/**
 * Returns all Search Console properties for the connected account.
 * `eligible` is true when the permission level allows Search Analytics queries
 * (siteOwner or siteFullUser). siteRestrictedUser cannot call searchanalytics.query.
 */
export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    if (!(await isGoogleConnected())) {
      return fail("Google account is not connected", "NOT_CONNECTED", 400);
    }
    const auth = await getAuthorizedClient();
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const res = await searchconsole.sites.list();
    const sites = (res.data.siteEntry ?? []).map((s) => {
      const level = s.permissionLevel ?? "";
      return {
        siteUrl: s.siteUrl ?? "",
        permissionLevel: level,
        eligible: level === "siteOwner" || level === "siteFullUser",
      };
    });
    return ok(sites);
  } catch (error) {
    return serverError(error);
  }
}
