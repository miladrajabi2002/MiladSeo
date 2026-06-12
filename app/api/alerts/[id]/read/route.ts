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

/** POST marks a single alert as read. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid alert id", "INVALID_ID", 422);
  try {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) return notFound("Alert");
    const updated = await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}
