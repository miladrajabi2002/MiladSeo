import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/gsc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?google=error", baseUrl));
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(new URL("/?google=connected", baseUrl));
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return NextResponse.redirect(new URL("/?google=error", baseUrl));
  }
}
