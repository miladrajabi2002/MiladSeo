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
import { getAnnotations } from "@/lib/insights";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    return ok(await getAnnotations(id));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);

  let body: { date?: string; title?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", "INVALID_BODY", 422);
  }
  const title = body.title?.trim();
  const date = body.date ? new Date(`${body.date}T00:00:00.000Z`) : null;
  if (!title || !date || Number.isNaN(date.getTime())) {
    return fail("date (YYYY-MM-DD) and title are required", "INVALID_BODY", 422);
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project");
    const annotation = await prisma.annotation.create({
      data: { projectId: id, date, title, note: body.note?.trim() || null },
    });
    return ok(
      {
        id: annotation.id,
        date: body.date,
        title: annotation.title,
        note: annotation.note,
      },
      201
    );
  } catch (error) {
    return serverError(error);
  }
}
