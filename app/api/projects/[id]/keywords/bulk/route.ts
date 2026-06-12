import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fail,
  isAuthenticated,
  notFound,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";

export const dynamic = "force-dynamic";

interface BulkBody {
  keywords?: unknown;
  group?: unknown;
}

/**
 * POST adds many keywords at once.
 * Body: { keywords: string[], group?: string } — duplicates are skipped.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project");

    const body = (await request.json()) as BulkBody;
    if (!Array.isArray(body.keywords)) {
      return fail("keywords must be an array of strings", "VALIDATION_ERROR", 422);
    }
    const group =
      typeof body.group === "string" && body.group.trim()
        ? body.group.trim()
        : null;

    const texts = Array.from(
      new Set(
        body.keywords
          .filter((k): k is string => typeof k === "string")
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      )
    );
    if (texts.length === 0) {
      return fail("No valid keywords provided", "VALIDATION_ERROR", 422);
    }

    const existing = await prisma.keyword.findMany({
      where: { projectId: id, text: { in: texts } },
      select: { text: true },
    });
    const existingSet = new Set(existing.map((k) => k.text));
    const toCreate = texts.filter((t) => !existingSet.has(t));

    if (toCreate.length > 0) {
      await prisma.keyword.createMany({
        data: toCreate.map((text) => ({ text, group, projectId: id })),
      });
    }

    return ok({ created: toCreate.length, skipped: texts.length - toCreate.length }, 201);
  } catch (error) {
    return serverError(error);
  }
}
