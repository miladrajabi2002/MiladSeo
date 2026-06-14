import { google } from "googleapis";
import { format, subDays } from "date-fns";
import { prisma } from "./prisma";
import { getAuthorizedClient } from "./gsc";
import type { IndexCoveragePoint, IndexStatusRow } from "./types";

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
    const verdict = status?.verdict ?? "VERDICT_UNSPECIFIED";
    const coverageState = status?.coverageState ?? null;
    const record = await prisma.urlIndexStatus.upsert({
      where: { projectId_urlPath: { projectId, urlPath } },
      update: {
        verdict,
        coverageState,
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
        verdict,
        coverageState,
        indexingState: status?.indexingState ?? null,
        robotsState: status?.robotsTxtState ?? null,
        fetchState: status?.pageFetchState ?? null,
        lastCrawlTime: status?.lastCrawlTime
          ? new Date(status.lastCrawlTime)
          : null,
        googleCanonical: status?.googleCanonical ?? null,
      },
    });

    // Append-only daily snapshot for the coverage trend chart
    const day = format(new Date(), "yyyy-MM-dd");
    await prisma.urlIndexHistory.upsert({
      where: { projectId_urlPath_day: { projectId, urlPath, day } },
      update: { verdict, coverageState, checkedAt: new Date() },
      create: { projectId, urlPath, verdict, coverageState, day },
    });

    results.push(toRow(record));
  }

  return results;
}

/**
 * Daily index-coverage trend: how many URLs were PASS / FAIL / NEUTRAL on each
 * day they were inspected, for the last `days` days.
 */
export async function getIndexHistory(
  projectId: number,
  days = 90
): Promise<IndexCoveragePoint[]> {
  const since = format(subDays(new Date(), Math.min(Math.max(days, 1), 480)), "yyyy-MM-dd");
  const rows = await prisma.urlIndexHistory.findMany({
    where: { projectId, day: { gte: since } },
    orderBy: { day: "asc" },
  });

  const byDay = new Map<string, { pass: number; fail: number; neutral: number }>();
  for (const r of rows) {
    const e = byDay.get(r.day) ?? { pass: 0, fail: 0, neutral: 0 };
    if (r.verdict === "PASS") e.pass++;
    else if (r.verdict === "FAIL") e.fail++;
    else e.neutral++;
    byDay.set(r.day, e);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }));
}
