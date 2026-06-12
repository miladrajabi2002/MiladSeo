import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function fail(error: string, code: string, status = 400): NextResponse {
  return NextResponse.json({ error, code }, { status });
}

export function notFound(what = "Resource"): NextResponse {
  return fail(`${what} not found`, "NOT_FOUND", 404);
}

export function unauthorized(): NextResponse {
  return fail("Authentication required", "UNAUTHORIZED", 401);
}

export function serverError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Internal server error";
  return fail(message, "INTERNAL_ERROR", 500);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session !== null;
}

export function parseId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}
