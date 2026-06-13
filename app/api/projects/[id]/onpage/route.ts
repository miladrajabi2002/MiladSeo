import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, isAuthenticated, ok, parseId, unauthorized } from "@/lib/api";
import { auditPage } from "@/lib/onpage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET runs an on-page / technical check for a URL (?url=...). When url is
 * omitted it falls back to the project's domain home page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return fail("Project not found", "NOT_FOUND", 404);

  const requested = request.nextUrl.searchParams.get("url")?.trim();
  const target = requested || `https://${project.domain.replace(/\/$/, "")}`;

  try {
    const report = await auditPage(target);
    return ok(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch the page";
    return fail(message, "FETCH_FAILED", 502);
  }
}
