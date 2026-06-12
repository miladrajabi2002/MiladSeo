import { NextResponse } from "next/server";
import {
  fail,
  isAuthenticated,
  notFound,
  ok,
  parseId,
  serverError,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createShareLink, getShareLink, revokeShareLinks } from "@/lib/share";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await getShareLink(id));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project");
    return ok(await createShareLink(id), 201);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    await revokeShareLinks(id);
    return ok({ revoked: true });
  } catch (error) {
    return serverError(error);
  }
}
