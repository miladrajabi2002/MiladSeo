import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import { getKeywordRows } from "@/lib/rankings";
import type { ProjectSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_LOCATIONS = [
  "Iran",
  "UAE",
  "Saudi Arabia",
  "Egypt",
  "UK",
  "USA",
  "Other",
];

export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { keywords: true } } },
    });

    const summaries: ProjectSummary[] = [];
    for (const project of projects) {
      const rows = await getKeywordRows(project.id);
      const positions = rows
        .map((r) => r.desktopPos)
        .filter((p): p is number => p !== null);
      const avg =
        positions.length > 0
          ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
          : null;
      summaries.push({
        id: project.id,
        name: project.name,
        domain: project.domain,
        gscProperty: project.gscProperty,
        location: project.location,
        keywordCount: project._count.keywords,
        avgPosition: avg,
        lastSyncAt: project.lastSyncAt?.toISOString() ?? null,
        createdAt: project.createdAt.toISOString(),
      });
    }

    return ok(summaries);
  } catch (error) {
    return serverError(error);
  }
}

interface CreateProjectBody {
  name?: unknown;
  domain?: unknown;
  gscProperty?: unknown;
  location?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const body = (await request.json()) as CreateProjectBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const domain = typeof body.domain === "string" ? body.domain.trim() : "";
    const gscProperty =
      typeof body.gscProperty === "string" ? body.gscProperty.trim() : "";
    const location =
      typeof body.location === "string" && VALID_LOCATIONS.includes(body.location)
        ? body.location
        : "Iran";

    if (!name || !domain || !gscProperty) {
      return fail(
        "name, domain and gscProperty are required",
        "VALIDATION_ERROR",
        422
      );
    }

    const project = await prisma.project.create({
      data: { name, domain, gscProperty, location },
    });
    return ok(project, 201);
  } catch (error) {
    return serverError(error);
  }
}
