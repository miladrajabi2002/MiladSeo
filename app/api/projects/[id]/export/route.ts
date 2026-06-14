import { NextRequest, NextResponse } from "next/server";
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
import { getFullExport } from "@/lib/export";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET a full project export. Default returns JSON wrapped in { data }; pass
 * ?format=file to download a pretty-printed .json attachment.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse | Response> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project");

    const data = await getFullExport(id);

    if (request.nextUrl.searchParams.get("format") === "file") {
      const stamp = new Date().toISOString().slice(0, 10);
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${project.domain}-export-${stamp}.json"`,
        },
      });
    }

    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
