import { NextResponse } from "next/server";
import { fail, ok, serverError } from "@/lib/api";
import { getPublicDashboard } from "@/lib/share";

export const dynamic = "force-dynamic";

/** Public, unauthenticated — the unguessable token IS the credential. */
export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  const token = params.token;
  if (!token || token.length < 16) {
    return fail("Invalid share token", "INVALID_TOKEN", 422);
  }
  try {
    const dashboard = await getPublicDashboard(token);
    if (!dashboard) {
      return fail("This share link has been revoked or does not exist", "NOT_FOUND", 404);
    }
    return ok(dashboard);
  } catch (error) {
    return serverError(error);
  }
}
