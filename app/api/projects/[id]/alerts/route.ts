import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fail,
  isAuthenticated,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/** GET alerts; optional ?filter=jumped|dropped|unread */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const filter = request.nextUrl.searchParams.get("filter");
    const where: { projectId: number; type?: string; isRead?: boolean } = {
      projectId: id,
    };
    if (filter === "jumped" || filter === "dropped") where.type = filter;
    if (filter === "unread") where.isRead = false;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(alerts);
  } catch (error) {
    return serverError(error);
  }
}

/** PUT marks all of the project's alerts as read. */
export async function PUT(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const result = await prisma.alert.updateMany({
      where: { projectId: id, isRead: false },
      data: { isRead: true },
    });
    return ok({ updated: result.count });
  } catch (error) {
    return serverError(error);
  }
}
