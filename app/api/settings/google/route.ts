import { NextResponse } from "next/server";
import { isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import { clearRefreshToken, isGoogleConnected } from "@/lib/gsc";

export const dynamic = "force-dynamic";

/** GET reports whether a Google refresh token is stored. */
export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const connected = await isGoogleConnected();
    const configured = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );
    return ok({ connected, configured });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * DELETE disconnects the Google account by removing the stored refresh token.
 * `fullyCleared` is false when GOOGLE_REFRESH_TOKEN is still set in the
 * environment, in which case the connection persists from that fallback.
 */
export async function DELETE(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const fullyCleared = await clearRefreshToken();
    return ok({ connected: !fullyCleared, fullyCleared });
  } catch (error) {
    return serverError(error);
  }
}
