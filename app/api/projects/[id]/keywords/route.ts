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
import { getKeywordRows } from "@/lib/rankings";
import type { KeywordRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: KeywordRow[]): string {
  const header = [
    "keyword",
    "url",
    "group",
    "desktop_position",
    "mobile_position",
    "change_7d",
    "clicks",
    "impressions",
  ].join(",");
  const lines = rows.map((r) =>
    [
      escapeCsv(r.text),
      escapeCsv(r.urlPath ?? ""),
      escapeCsv(r.group ?? ""),
      r.desktopPos ?? "",
      r.mobilePos ?? "",
      r.change ?? "",
      r.clicks,
      r.impressions,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

/** GET keyword rows; pass ?format=csv to download as CSV. */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse | Response> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project");

    const rows = await getKeywordRows(id);

    if (request.nextUrl.searchParams.get("format") === "csv") {
      return new Response(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${project.domain}-keywords.csv"`,
        },
      });
    }

    return ok(rows);
  } catch (error) {
    return serverError(error);
  }
}

interface CreateKeywordBody {
  text?: unknown;
  urlPath?: unknown;
  group?: unknown;
}

/** POST adds a single keyword. */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project");

    const body = (await request.json()) as CreateKeywordBody;
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return fail("text is required", "VALIDATION_ERROR", 422);

    const keyword = await prisma.keyword.create({
      data: {
        text,
        urlPath: typeof body.urlPath === "string" ? body.urlPath.trim() || null : null,
        group: typeof body.group === "string" ? body.group.trim() || null : null,
        projectId: id,
      },
    });
    return ok(keyword, 201);
  } catch (error) {
    return serverError(error);
  }
}

interface UpdateKeywordBody {
  keywordId?: unknown;
  group?: unknown;
  urlPath?: unknown;
}

/** PATCH updates a keyword's group / urlPath. */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const body = (await request.json()) as UpdateKeywordBody;
    const keywordId =
      typeof body.keywordId === "number" ? body.keywordId : null;
    if (keywordId === null) {
      return fail("keywordId is required", "VALIDATION_ERROR", 422);
    }

    const keyword = await prisma.keyword.findFirst({
      where: { id: keywordId, projectId: id },
    });
    if (!keyword) return notFound("Keyword");

    const updated = await prisma.keyword.update({
      where: { id: keywordId },
      data: {
        ...(body.group !== undefined
          ? { group: typeof body.group === "string" && body.group.trim() ? body.group.trim() : null }
          : {}),
        ...(body.urlPath !== undefined
          ? { urlPath: typeof body.urlPath === "string" && body.urlPath.trim() ? body.urlPath.trim() : null }
          : {}),
      },
    });
    return ok(updated);
  } catch (error) {
    return serverError(error);
  }
}

/** DELETE removes a keyword (?keywordId=N). */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  const id = parseId(params.id);
  if (id === null) return fail("Invalid project id", "INVALID_ID", 422);
  try {
    const keywordId = parseId(
      request.nextUrl.searchParams.get("keywordId") ?? ""
    );
    if (keywordId === null) {
      return fail("keywordId query param is required", "VALIDATION_ERROR", 422);
    }
    const keyword = await prisma.keyword.findFirst({
      where: { id: keywordId, projectId: id },
    });
    if (!keyword) return notFound("Keyword");
    await prisma.keyword.delete({ where: { id: keywordId } });
    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
