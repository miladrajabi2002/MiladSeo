import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import { getKeywordRows } from "@/lib/rankings";
import type { DistributionBucket, ProjectSummary } from "@/lib/types";

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

      const distribution: DistributionBucket[] = [
        { bucket: "1-3", count: positions.filter((p) => p <= 3).length, color: "var(--pos-top3)" },
        { bucket: "4-10", count: positions.filter((p) => p > 3 && p <= 10).length, color: "var(--pos-top10)" },
        { bucket: "11-20", count: positions.filter((p) => p > 10 && p <= 20).length, color: "var(--pos-top20)" },
        { bucket: "21-50", count: positions.filter((p) => p > 20 && p <= 50).length, color: "var(--pos-top50)" },
        { bucket: "50+", count: positions.filter((p) => p > 50).length, color: "var(--pos-beyond)" },
      ];

      const unreadAlerts = await prisma.alert.count({
        where: { projectId: project.id, isRead: false },
      });

      summaries.push({
        id: project.id,
        name: project.name,
        domain: project.domain,
        gscProperty: project.gscProperty,
        location: project.location,
        color: project.color,
        keywordCount: project._count.keywords,
        avgPosition: avg,
        lastSyncAt: project.lastSyncAt?.toISOString() ?? null,
        createdAt: project.createdAt.toISOString(),
        top3: positions.filter((p) => p <= 3).length,
        top10: positions.filter((p) => p <= 10).length,
        improved: rows.filter((r) => r.change !== null && r.change > 0).length,
        dropped: rows.filter((r) => r.change !== null && r.change < 0).length,
        unreadAlerts,
        distribution,
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
  color?: unknown;
}

function validHex(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
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
      data: { name, domain, gscProperty, location, color: validHex(body.color) },
    });
    return ok(project, 201);
  } catch (error) {
    return serverError(error);
  }
}
