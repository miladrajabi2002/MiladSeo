import { NextResponse } from "next/server";
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

interface RouteParams {
  params: { id: string };
}

export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { keywords: true, alerts: { where: { isRead: false } } },
        },
      },
    });
    if (!project) return notFound("Project");
    return ok({
      id: project.id,
      name: project.name,
      domain: project.domain,
      gscProperty: project.gscProperty,
      location: project.location,
      lastSyncAt: project.lastSyncAt?.toISOString() ?? null,
      createdAt: project.createdAt.toISOString(),
      keywordCount: project._count.keywords,
      unreadAlerts: project._count.alerts,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project");
    await prisma.project.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
