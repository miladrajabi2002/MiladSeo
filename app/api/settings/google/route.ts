import { NextResponse } from "next/server";
import { isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import { isGoogleConnected } from "@/lib/gsc";

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
