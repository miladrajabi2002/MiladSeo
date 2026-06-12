import { google } from "googleapis";
import { prisma } from "./prisma";
import { getAuthorizedClient } from "./gsc";
import type { IndexStatusRow } from "./types";

/** Google allows 2000 inspections/day per property; keep batches small. */
const MAX_BATCH = 25;

function fullUrl(domain: string, urlPath: string): string {
  return `https://${domain.replace(/\/$/, "")}${urlPath}`;
}

function toRow(record: {
  urlPath: string;
  verdict: string;
  coverageState: string | null;
  indexingState: string | null;
  robotsState: string | null;
  fetchState: string | null;
  lastCrawlTime: Date | null;
  googleCanonical: string | null;
  checkedAt: Date;
}): IndexStatusRow {
  return {
    urlPath: record.urlPath,
    verdict: record.verdict,
    coverageState: record.coverageState,
    indexingState: record.indexingState,
    robotsState: record.robotsState,
    fetchState: record.fetchState,
    lastCrawlTime: record.lastCrawlTime?.toISOString() ?? null,
    googleCanonical: record.googleCanonical,
    checkedAt: record.checkedAt.toISOString(),
  };
}

/** All distinct page paths of a project plus any cached inspection result. */
export async function getIndexStatuses(
  projectId: number
): Promise<IndexStatusRow[]> {
  const keywords = await prisma.keyword.findMany({
    where: { projectId, urlPath: { not: null } },
    select: { urlPath: true },
    distinct: ["urlPath"],
  });
  const cached = await prisma.urlIndexStatus.findMany({ where: { projectId } });
  const cacheMap = new Map(cached.map((c) => [c.urlPath, c]));

  return keywords
    .map((k) => k.urlPath as string)
    .sort()
    .map((urlPath) => {
      const hit = cacheMap.get(urlPath);
      if (hit) return toRow(hit);
      return {
        urlPath,
        verdict: null,
        coverageState: null,
        indexingState: null,
        robotsState: null,
        fetchState: null,
        lastCrawlTime: null,
        googleCanonical: null,
        checkedAt: null,
      };
    });
}

/**
 * Inspects the given paths (or the stalest unchecked ones when omitted)
 * sequentially — the API rejects parallel calls — and caches each result.
 */
export async function inspectUrls(
  projectId: number,
  urlPaths?: string[]
): Promise<IndexStatusRow[]> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  let targets = urlPaths;
  if (!targets || targets.length === 0) {
    const all = await getIndexStatuses(projectId);
    // never-checked first, then oldest checks
    targets = all
      .sort((a, b) => (a.checkedAt ?? "").localeCompare(b.checkedAt ?? ""))
      .slice(0, MAX_BATCH)
      .map((r) => r.urlPath);
  }
  targets = targets.slice(0, MAX_BATCH);

  const auth = await getAuthorizedClient();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const results: IndexStatusRow[] = [];
  for (const urlPath of targets) {
    const response = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: fullUrl(project.domain, urlPath),
        siteUrl: project.gscProperty,
      },
    });
    const status = response.data.inspectionResult?.indexStatusResult;
    const record = await prisma.urlIndexStatus.upsert({
      where: { projectId_urlPath: { projectId, urlPath } },
      update: {
        verdict: status?.verdict ?? "VERDICT_UNSPECIFIED",
        coverageState: status?.coverageState ?? null,
        indexingState: status?.indexingState ?? null,
        robotsState: status?.robotsTxtState ?? null,
        fetchState: status?.pageFetchState ?? null,
        lastCrawlTime: status?.lastCrawlTime
          ? new Date(status.lastCrawlTime)
          : null,
        googleCanonical: status?.googleCanonical ?? null,
        checkedAt: new Date(),
      },
      create: {
        projectId,
        urlPath,
        verdict: status?.verdict ?? "VERDICT_UNSPECIFIED",
        coverageState: status?.coverageState ?? null,
        indexingState: status?.indexingState ?? null,
        robotsState: status?.robotsTxtState ?? null,
        fetchState: status?.pageFetchState ?? null,
        lastCrawlTime: status?.lastCrawlTime
          ? new Date(status.lastCrawlTime)
          : null,
        googleCanonical: status?.googleCanonical ?? null,
      },
    });
    results.push(toRow(record));
  }

  return results;
}
