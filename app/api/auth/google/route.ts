import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthUrl } from "@/lib/gsc";
import { serverError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000")
    );
  }
  try {
    return NextResponse.redirect(getAuthUrl());
  } catch (error) {
    return serverError(error);
  }
}
