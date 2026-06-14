import { prisma } from "./prisma";
import { getKeywordRows, getOverviewStats, getMovers, getMobileData } from "./rankings";
import { getTraffic, getVisibility, getPages, getCannibalization } from "./insights";
import { getPageSpeedResults } from "./pagespeed";
import { getIndexStatuses } from "./inspection";

/**
 * Gathers a complete snapshot of a project's data for a full JSON export.
 * Everything here is already-computed/cached data — no external API calls.
 */
export async function getFullExport(projectId: number): Promise<Record<string, unknown>> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const [keywords, overview, movers, mobile, traffic, visibility, pages, cannibalization, speed, index] =
    await Promise.all([
      getKeywordRows(projectId),
      getOverviewStats(projectId),
      getMovers(projectId),
      getMobileData(projectId),
      getTraffic(projectId, 90),
      getVisibility(projectId, 90),
      getPages(projectId, 90),
      getCannibalization(projectId),
      getPageSpeedResults(projectId),
      getIndexStatuses(projectId),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      domain: project.domain,
      gscProperty: project.gscProperty,
      location: project.location,
      lastSyncAt: project.lastSyncAt?.toISOString() ?? null,
    },
    overview,
    keywords,
    movers,
    mobile,
    traffic,
    visibility,
    pages,
    cannibalization,
    pageSpeed: speed,
    indexCoverage: index,
  };
}
