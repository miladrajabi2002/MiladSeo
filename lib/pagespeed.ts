import axios from "axios";
import { prisma } from "./prisma";
import type { PageSpeedRow } from "./types";

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

export async function getPageSpeedResults(
  projectId: number
): Promise<PageSpeedRow[]> {
  const rows = await prisma.pageSpeedResult.findMany({
    where: { projectId },
    orderBy: { urlPath: "asc" },
  });
  return rows.map(toRow);
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

    const data = {
      score: Math.round(rawScore * 100),
      lcpMs: metric("largest-contentful-paint"),
      cls: metric("cumulative-layout-shift"),
      inpMs: metric("interaction-to-next-paint"),
      fcpMs: metric("first-contentful-paint"),
      ttfbMs: metric("server-response-time"),
      checkedAt: new Date(),
    };

    const record = await prisma.pageSpeedResult.upsert({
      where: {
        projectId_urlPath_strategy: { projectId, urlPath, strategy },
      },
      update: data,
      create: { projectId, urlPath, strategy, ...data },
    });
    results.push(toRow(record));
  }

  return results;
}
