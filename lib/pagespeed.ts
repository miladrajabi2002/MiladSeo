import axios from "axios";
import { format } from "date-fns";
import { prisma } from "./prisma";
import type { PageSpeedHistoryPoint, PageSpeedRow } from "./types";

const ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** Each live PageSpeed run takes 10-20s; keep batches very small. */
const MAX_BATCH = 3;

interface LighthouseAudit {
  numericValue?: number;
}

interface PageSpeedApiResponse {
  lighthouseResult?: {
    categories?: { performance?: { score?: number } };
    audits?: Record<string, LighthouseAudit>;
  };
}

function fullUrl(domain: string, urlPath: string): string {
  return `https://${domain.replace(/\/$/, "")}${urlPath}`;
}

function toRow(record: {
  urlPath: string;
  strategy: string;
  score: number;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  fcpMs: number | null;
  ttfbMs: number | null;
  checkedAt: Date;
}): PageSpeedRow {
  return {
    urlPath: record.urlPath,
    strategy: record.strategy as "mobile" | "desktop",
    score: record.score,
    lcpMs: record.lcpMs,
    cls: record.cls,
    inpMs: record.inpMs,
    fcpMs: record.fcpMs,
    ttfbMs: record.ttfbMs,
    checkedAt: record.checkedAt.toISOString(),
  };
}

/** Latest cached score per (urlPath, strategy). */
export async function getPageSpeedResults(
  projectId: number
): Promise<PageSpeedRow[]> {
  const rows = await prisma.pageSpeedResult.findMany({
    where: { projectId },
    orderBy: [{ urlPath: "asc" }, { checkedAt: "desc" }],
  });
  // Keep only the most recent row per url+strategy (rows already desc by date)
  const seen = new Set<string>();
  const latest: typeof rows = [];
  for (const r of rows) {
    const key = `${r.urlPath}|${r.strategy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(r);
  }
  latest.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
  return latest.map(toRow);
}

/**
 * Daily PageSpeed score/CWV history for charting. Optionally narrowed to one
 * URL; otherwise returns the project-wide daily average per strategy.
 */
export async function getPageSpeedHistory(
  projectId: number,
  urlPath?: string,
  strategy?: "mobile" | "desktop"
): Promise<PageSpeedHistoryPoint[]> {
  const rows = await prisma.pageSpeedResult.findMany({
    where: {
      projectId,
      ...(urlPath ? { urlPath } : {}),
      ...(strategy ? { strategy } : {}),
    },
    orderBy: { day: "asc" },
  });

  // Average per (day, strategy) when aggregating across URLs
  const byKey = new Map<
    string,
    { day: string; strategy: string; score: number[]; lcp: number[]; cls: number[]; inp: number[] }
  >();
  for (const r of rows) {
    const key = `${r.day}|${r.strategy}`;
    const e =
      byKey.get(key) ??
      { day: r.day, strategy: r.strategy, score: [], lcp: [], cls: [], inp: [] };
    e.score.push(r.score);
    if (r.lcpMs !== null) e.lcp.push(r.lcpMs);
    if (r.cls !== null) e.cls.push(r.cls);
    if (r.inpMs !== null) e.inp.push(r.inpMs);
    byKey.set(key, e);
  }

  const avg = (xs: number[]): number | null =>
    xs.length > 0 ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;

  return Array.from(byKey.values())
    .map((e) => ({
      day: e.day,
      strategy: e.strategy as "mobile" | "desktop",
      score: Math.round((e.score.reduce((a, b) => a + b, 0) / e.score.length) || 0),
      lcpMs: avg(e.lcp),
      cls: avg(e.cls),
      inpMs: avg(e.inp),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Runs PageSpeed Insights for the given paths and caches the scores.
 * Works without an API key (shared quota); set PAGESPEED_API_KEY for
 * a dedicated quota. Runs sequentially — each audit is slow and Google
 * throttles parallel requests.
 */
export async function runPageSpeed(
  projectId: number,
  urlPaths: string[],
  strategy: "mobile" | "desktop"
): Promise<PageSpeedRow[]> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const results: PageSpeedRow[] = [];
  for (const urlPath of urlPaths.slice(0, MAX_BATCH)) {
    const params: Record<string, string> = {
      url: fullUrl(project.domain, urlPath),
      strategy,
      category: "performance",
    };
    if (process.env.PAGESPEED_API_KEY) {
      params.key = process.env.PAGESPEED_API_KEY;
    }

    const response = await axios.get<PageSpeedApiResponse>(ENDPOINT, {
      params,
      timeout: 60_000,
    });

    const lighthouse = response.data.lighthouseResult;
    const rawScore = lighthouse?.categories?.performance?.score;
    if (rawScore === undefined || rawScore === null) {
      throw new Error(`PageSpeed returned no score for ${urlPath}`);
    }
    const audits = lighthouse?.audits ?? {};
    const metric = (id: string): number | null => {
      const value = audits[id]?.numericValue;
      return value !== undefined ? Math.round(value * 100) / 100 : null;
    };

    const day = format(new Date(), "yyyy-MM-dd");
    const data = {
      score: Math.round(rawScore * 100),
      lcpMs: metric("largest-contentful-paint"),
      cls: metric("cumulative-layout-shift"),
      inpMs: metric("interaction-to-next-paint"),
      fcpMs: metric("first-contentful-paint"),
      ttfbMs: metric("server-response-time"),
      checkedAt: new Date(),
    };

    // One row per URL+strategy per day — re-running today overwrites today's
    // score while preserving previous days for the history chart.
    const record = await prisma.pageSpeedResult.upsert({
      where: {
        projectId_urlPath_strategy_day: { projectId, urlPath, strategy, day },
      },
      update: data,
      create: { projectId, urlPath, strategy, day, ...data },
    });
    results.push(toRow(record));
  }

  return results;
}
