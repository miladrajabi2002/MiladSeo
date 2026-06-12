import { differenceInCalendarDays, format, subDays } from "date-fns";
import { prisma } from "./prisma";
import type {
  DistributionBucket,
  HistoryMatrix,
  KeywordRow,
  MobileData,
  MoversData,
  OverviewStats,
} from "./types";

interface RankingPoint {
  position: number | null;
  clicks: number | null;
  impressions: number | null;
  date: Date;
}

interface KeywordWithRankings {
  id: number;
  text: string;
  urlPath: string | null;
  group: string | null;
  desktop: RankingPoint[];
  mobile: RankingPoint[];
}

const LOOKBACK_DAYS = 30;

async function loadKeywords(projectId: number): Promise<KeywordWithRankings[]> {
  const keywords = await prisma.keyword.findMany({
    where: { projectId },
    include: {
      rankings: {
        where: { date: { gte: subDays(new Date(), LOOKBACK_DAYS) } },
        orderBy: { date: "asc" },
        select: {
          position: true,
          clicks: true,
          impressions: true,
          device: true,
          date: true,
        },
      },
    },
    orderBy: { text: "asc" },
  });

  return keywords.map((k) => ({
    id: k.id,
    text: k.text,
    urlPath: k.urlPath,
    group: k.group,
    desktop: k.rankings.filter((r) => r.device === "desktop"),
    mobile: k.rankings.filter((r) => r.device === "mobile"),
  }));
}

function latestWithPosition(points: RankingPoint[]): RankingPoint | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    if (p.position !== null) return p;
  }
  return null;
}

/**
 * Finds the ranking closest to `targetDaysAgo` days before `reference`,
 * accepting anything between 5 and 10 days back so sparse data still
 * produces a week-over-week comparison.
 */
function previousPosition(
  points: RankingPoint[],
  reference: Date,
  targetDaysAgo = 7
): number | null {
  let best: { distance: number; position: number } | null = null;
  for (const p of points) {
    if (p.position === null) continue;
    const daysAgo = differenceInCalendarDays(reference, p.date);
    if (daysAgo < targetDaysAgo - 2 || daysAgo > targetDaysAgo + 3) continue;
    const distance = Math.abs(daysAgo - targetDaysAgo);
    if (!best || distance < best.distance) {
      best = { distance, position: p.position };
    }
  }
  return best ? best.position : null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function toKeywordRow(k: KeywordWithRankings): KeywordRow {
  const latestDesktop = latestWithPosition(k.desktop);
  const latestMobile = latestWithPosition(k.mobile);

  let change: number | null = null;
  if (latestDesktop && latestDesktop.position !== null) {
    const prev = previousPosition(k.desktop, latestDesktop.date);
    if (prev !== null) {
      change = round1(prev - latestDesktop.position);
    }
  }

  const trend = k.desktop
    .filter((p): p is RankingPoint & { position: number } => p.position !== null)
    .slice(-7)
    .map((p) => round1(p.position));

  return {
    id: k.id,
    text: k.text,
    urlPath: k.urlPath,
    group: k.group,
    desktopPos:
      latestDesktop && latestDesktop.position !== null
        ? round1(latestDesktop.position)
        : null,
    mobilePos:
      latestMobile && latestMobile.position !== null
        ? round1(latestMobile.position)
        : null,
    change,
    trend,
    clicks: latestDesktop?.clicks ?? 0,
    impressions: latestDesktop?.impressions ?? 0,
  };
}

export async function getKeywordRows(projectId: number): Promise<KeywordRow[]> {
  const keywords = await loadKeywords(projectId);
  return keywords.map(toKeywordRow);
}

export async function getOverviewStats(
  projectId: number
): Promise<OverviewStats> {
  const rows = await getKeywordRows(projectId);
  const positions = rows
    .map((r) => r.desktopPos)
    .filter((p): p is number => p !== null);

  // Each bucket covers (min, max]
  const buckets: { label: string; min: number; max: number; color: string }[] =
    [
      { label: "1-3", min: 0, max: 3, color: "var(--pos-top3)" },
      { label: "4-10", min: 3, max: 10, color: "var(--pos-top10)" },
      { label: "11-20", min: 10, max: 20, color: "var(--pos-top20)" },
      { label: "21-50", min: 20, max: 50, color: "var(--pos-top50)" },
      { label: "51-100", min: 50, max: 100, color: "var(--pos-beyond)" },
      { label: "100+", min: 100, max: Infinity, color: "var(--text-muted)" },
    ];

  const distribution: DistributionBucket[] = buckets.map((b) => ({
    bucket: b.label,
    count: positions.filter((p) => p > b.min && p <= b.max).length,
    color: b.color,
  }));

  const avg =
    positions.length > 0
      ? round1(positions.reduce((a, b) => a + b, 0) / positions.length)
      : null;

  return {
    top10: positions.filter((p) => p <= 10).length,
    top20: positions.filter((p) => p > 10 && p <= 20).length,
    top50: positions.filter((p) => p > 20 && p <= 50).length,
    avgDesktop: avg,
    totalKeywords: rows.length,
    distribution,
  };
}

export async function getMovers(projectId: number): Promise<MoversData> {
  const rows = await getKeywordRows(projectId);

  const improved = rows
    .filter(
      (r): r is KeywordRow & { change: number; desktopPos: number } =>
        r.change !== null && r.change > 0 && r.desktopPos !== null
    )
    .map((r) => ({
      id: r.id,
      text: r.text,
      group: r.group,
      prevPos: round1(r.desktopPos + r.change),
      nowPos: r.desktopPos,
      delta: r.change,
      trend: r.trend,
    }))
    .sort((a, b) => b.delta - a.delta);

  const dropped = rows
    .filter(
      (r): r is KeywordRow & { change: number; desktopPos: number } =>
        r.change !== null && r.change < 0 && r.desktopPos !== null
    )
    .map((r) => ({
      id: r.id,
      text: r.text,
      group: r.group,
      prevPos: round1(r.desktopPos + r.change),
      nowPos: r.desktopPos,
      delta: r.change,
      trend: r.trend,
    }))
    .sort((a, b) => a.delta - b.delta);

  return { improved, dropped };
}

export async function getMobileData(projectId: number): Promise<MobileData> {
  const all = await getKeywordRows(projectId);

  const mobileRows = all.filter(
    (r): r is KeywordRow & { mobilePos: number } => r.mobilePos !== null
  );
  const both = mobileRows.filter(
    (r): r is KeywordRow & { mobilePos: number; desktopPos: number } =>
      r.desktopPos !== null
  );

  const rows = both
    .map((r) => ({
      id: r.id,
      text: r.text,
      group: r.group,
      mobilePos: r.mobilePos,
      desktopPos: r.desktopPos,
      gap: round1(r.mobilePos - r.desktopPos),
    }))
    .sort((a, b) => a.mobilePos - b.mobilePos);

  const avgMobile =
    mobileRows.length > 0
      ? round1(
          mobileRows.reduce((a, r) => a + r.mobilePos, 0) / mobileRows.length
        )
      : null;

  const topMobile = mobileRows
    .slice()
    .sort((a, b) => a.mobilePos - b.mobilePos)
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      text: r.text,
      group: r.group,
      mobilePos: r.mobilePos,
    }));

  return {
    avgMobile,
    betterOnMobile: rows.filter((r) => r.gap < 0).length,
    worseOnMobile: rows.filter((r) => r.gap > 0).length,
    top10Mobile: mobileRows.filter((r) => r.mobilePos <= 10).length,
    rows,
    topMobile,
  };
}

export async function getHistoryMatrix(
  projectId: number
): Promise<HistoryMatrix> {
  const keywords = await loadKeywords(projectId);

  const dateSet = new Set<string>();
  for (const k of keywords) {
    for (const p of k.desktop) {
      dateSet.add(format(p.date, "yyyy-MM-dd"));
    }
  }
  const dates = Array.from(dateSet).sort();

  const rows = keywords.map((k) => {
    const byDate = new Map<string, number>();
    for (const p of k.desktop) {
      if (p.position !== null) {
        byDate.set(format(p.date, "yyyy-MM-dd"), round1(p.position));
      }
    }
    return {
      text: k.text,
      positions: dates.map((d) => byDate.get(d) ?? null),
    };
  });

  return { dates, rows };
}

/**
 * Compares each keyword's current desktop position with ~7 days ago and
 * creates an Alert for any move larger than 5 positions. Skips keywords
 * that already have an unread alert of the same type from the last 24h
 * so re-syncing doesn't spam duplicates.
 */
export async function detectAlerts(projectId: number): Promise<number> {
  const rows = await getKeywordRows(projectId);
  const since = subDays(new Date(), 1);
  let created = 0;

  for (const row of rows) {
    if (row.change === null || row.desktopPos === null) continue;
    if (Math.abs(row.change) <= 5) continue;

    const type = row.change > 0 ? "jumped" : "dropped";
    const existing = await prisma.alert.findFirst({
      where: {
        projectId,
        keyword: row.text,
        type,
        createdAt: { gte: since },
      },
    });
    if (existing) continue;

    await prisma.alert.create({
      data: {
        projectId,
        keyword: row.text,
        type,
        group: row.group,
        prevPos: round1(row.desktopPos + row.change),
        nowPos: row.desktopPos,
        delta: row.change,
      },
    });
    created++;
  }

  return created;
}
