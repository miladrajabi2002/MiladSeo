import { differenceInCalendarDays, format, subDays } from "date-fns";
import { prisma } from "./prisma";
import type {
  AnnotationRow,
  CannibalizationGroup,
  ComparisonData,
  KeywordHistory,
  OpportunityRow,
  PageRow,
  PeriodStats,
  TrafficData,
  TrafficPoint,
  VisibilityData,
} from "./types";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Industry-average organic CTR by position. Used both to flag
 * under-performing snippets and as the weight curve for the
 * visibility score (normalized so position 1 = weight 1).
 */
export function expectedCtr(position: number): number {
  if (position <= 1) return 0.28;
  if (position <= 2) return 0.15;
  if (position <= 3) return 0.11;
  if (position <= 4) return 0.08;
  if (position <= 5) return 0.07;
  if (position <= 6) return 0.05;
  if (position <= 7) return 0.04;
  if (position <= 8) return 0.035;
  if (position <= 9) return 0.03;
  if (position <= 10) return 0.025;
  if (position <= 20) return 0.012;
  if (position <= 50) return 0.005;
  return 0.002;
}

export async function getAnnotations(projectId: number): Promise<AnnotationRow[]> {
  const rows = await prisma.annotation.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
  });
  return rows.map((a) => ({
    id: a.id,
    date: dayKey(a.date),
    title: a.title,
    note: a.note,
  }));
}

// ---------------------------------------------------------------------------
// Keyword history (trend modal)
// ---------------------------------------------------------------------------

export async function getKeywordHistory(
  projectId: number,
  keywordId: number,
  days: number
): Promise<KeywordHistory | null> {
  const keyword = await prisma.keyword.findFirst({
    where: { id: keywordId, projectId },
    include: {
      rankings: {
        where: { date: { gte: subDays(new Date(), days) } },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!keyword) return null;

  const byDate = new Map<
    string,
    { desktopPos: number | null; mobilePos: number | null; clicks: number; impressions: number }
  >();
  for (const r of keyword.rankings) {
    const key = dayKey(r.date);
    const entry =
      byDate.get(key) ??
      { desktopPos: null, mobilePos: null, clicks: 0, impressions: 0 };
    if (r.device === "desktop" && r.position !== null) {
      entry.desktopPos = round1(r.position);
    }
    if (r.device === "mobile" && r.position !== null) {
      entry.mobilePos = round1(r.position);
    }
    entry.clicks += r.clicks ?? 0;
    entry.impressions += r.impressions ?? 0;
    byDate.set(key, entry);
  }

  const points = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return {
    id: keyword.id,
    text: keyword.text,
    urlPath: keyword.urlPath,
    group: keyword.group,
    points,
    annotations: await getAnnotations(projectId),
  };
}

// ---------------------------------------------------------------------------
// Period comparison (this week vs last week / this month vs last month)
// ---------------------------------------------------------------------------

interface RankingSlice {
  keywordId: number;
  position: number | null;
  clicks: number | null;
  impressions: number | null;
  device: string;
  date: Date;
}

function periodStats(label: string, rows: RankingSlice[]): PeriodStats {
  // Latest desktop position per keyword inside the window
  const latest = new Map<number, { position: number; date: Date }>();
  let clicks = 0;
  let impressions = 0;
  const positions: number[] = [];

  for (const r of rows) {
    clicks += r.clicks ?? 0;
    impressions += r.impressions ?? 0;
    if (r.device !== "desktop" || r.position === null) continue;
    positions.push(r.position);
    const prev = latest.get(r.keywordId);
    if (!prev || r.date > prev.date) {
      latest.set(r.keywordId, { position: r.position, date: r.date });
    }
  }

  const latestPositions = Array.from(latest.values()).map((v) => v.position);
  return {
    label,
    avgPosition:
      positions.length > 0
        ? round1(positions.reduce((a, b) => a + b, 0) / positions.length)
        : null,
    top3: latestPositions.filter((p) => p <= 3).length,
    top10: latestPositions.filter((p) => p <= 10).length,
    clicks,
    impressions,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : null,
  };
}

export async function getComparison(
  projectId: number,
  range: "week" | "month"
): Promise<ComparisonData> {
  const span = range === "week" ? 7 : 30;
  const now = new Date();
  const currentStart = subDays(now, span);
  const previousStart = subDays(now, span * 2);

  const rows = await prisma.keywordRanking.findMany({
    where: {
      keyword: { projectId },
      date: { gte: previousStart },
    },
    select: {
      keywordId: true,
      position: true,
      clicks: true,
      impressions: true,
      device: true,
      date: true,
    },
  });

  const current = rows.filter((r) => r.date >= currentStart);
  const previous = rows.filter((r) => r.date < currentStart);
  const labels =
    range === "week"
      ? (["This week", "Last week"] as const)
      : (["This month", "Last month"] as const);

  return {
    range,
    current: periodStats(labels[0], current),
    previous: periodStats(labels[1], previous),
  };
}

// ---------------------------------------------------------------------------
// Traffic (clicks / impressions / CTR) + snippet opportunities
// ---------------------------------------------------------------------------

const OPPORTUNITY_MIN_IMPRESSIONS = 100;

export async function getTrafficSeries(
  projectId: number,
  days: number
): Promise<TrafficPoint[]> {
  const rows = await prisma.keywordRanking.findMany({
    where: { keyword: { projectId }, date: { gte: subDays(new Date(), days) } },
    select: { clicks: true, impressions: true, date: true },
  });

  const byDate = new Map<string, { clicks: number; impressions: number }>();
  for (const r of rows) {
    const key = dayKey(r.date);
    const entry = byDate.get(key) ?? { clicks: 0, impressions: 0 };
    entry.clicks += r.clicks ?? 0;
    entry.impressions += r.impressions ?? 0;
    byDate.set(key, entry);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr:
        v.impressions > 0
          ? Math.round((v.clicks / v.impressions) * 1000) / 10
          : null,
    }));
}

export async function getTraffic(
  projectId: number,
  days: number
): Promise<TrafficData> {
  const series = await getTrafficSeries(projectId, days);
  const totalClicks = series.reduce((a, p) => a + p.clicks, 0);
  const totalImpressions = series.reduce((a, p) => a + p.impressions, 0);

  // Opportunities: aggregate the same window per keyword, then keep
  // queries with healthy impressions whose CTR sits well below the
  // curve for their position — i.e. title/description underperforms.
  const rows = await prisma.keywordRanking.findMany({
    where: { keyword: { projectId }, date: { gte: subDays(new Date(), days) } },
    select: {
      keywordId: true,
      position: true,
      clicks: true,
      impressions: true,
      device: true,
      date: true,
      keyword: { select: { text: true, urlPath: true, group: true } },
    },
  });

  const byKeyword = new Map<
    number,
    {
      text: string;
      urlPath: string | null;
      group: string | null;
      clicks: number;
      impressions: number;
      lastPosition: number | null;
      lastDate: Date | null;
    }
  >();
  for (const r of rows) {
    const entry =
      byKeyword.get(r.keywordId) ??
      {
        text: r.keyword.text,
        urlPath: r.keyword.urlPath,
        group: r.keyword.group,
        clicks: 0,
        impressions: 0,
        lastPosition: null,
        lastDate: null,
      };
    entry.clicks += r.clicks ?? 0;
    entry.impressions += r.impressions ?? 0;
    if (
      r.device === "desktop" &&
      r.position !== null &&
      (entry.lastDate === null || r.date > entry.lastDate)
    ) {
      entry.lastPosition = r.position;
      entry.lastDate = r.date;
    }
    byKeyword.set(r.keywordId, entry);
  }

  const opportunities: OpportunityRow[] = [];
  for (const [id, k] of byKeyword) {
    if (k.impressions < OPPORTUNITY_MIN_IMPRESSIONS) continue;
    if (k.lastPosition === null || k.lastPosition > 20) continue;
    const ctr = k.impressions > 0 ? k.clicks / k.impressions : 0;
    const expected = expectedCtr(k.lastPosition);
    if (ctr >= expected * 0.6) continue; // within 60% of the curve = fine
    opportunities.push({
      id,
      text: k.text,
      urlPath: k.urlPath,
      group: k.group,
      position: round1(k.lastPosition),
      impressions: k.impressions,
      clicks: k.clicks,
      ctr: Math.round(ctr * 1000) / 10,
      expectedCtr: Math.round(expected * 1000) / 10,
    });
  }
  opportunities.sort((a, b) => b.impressions - a.impressions);

  return {
    series,
    totalClicks,
    totalImpressions,
    avgCtr:
      totalImpressions > 0
        ? Math.round((totalClicks / totalImpressions) * 1000) / 10
        : null,
    opportunities: opportunities.slice(0, 50),
  };
}

// ---------------------------------------------------------------------------
// Pages view (per-URL aggregation)
// ---------------------------------------------------------------------------

export async function getPages(
  projectId: number,
  days = 30
): Promise<PageRow[]> {
  const since = subDays(new Date(), Math.min(Math.max(days, 1), 480));
  const keywords = await prisma.keyword.findMany({
    where: { projectId, urlPath: { not: null } },
    include: {
      rankings: {
        where: { date: { gte: since }, device: "desktop" },
        orderBy: { date: "asc" },
        select: { position: true, clicks: true, impressions: true, date: true },
      },
    },
  });

  interface PageAgg {
    keywordIds: Set<number>;
    clicks: number;
    impressions: number;
    // per-date positions to build the page-level average trend
    daily: Map<string, number[]>;
    latest: { keywordId: number; text: string; position: number | null }[];
  }

  const pages = new Map<string, PageAgg>();
  for (const k of keywords) {
    const path = k.urlPath as string;
    const agg: PageAgg =
      pages.get(path) ??
      { keywordIds: new Set(), clicks: 0, impressions: 0, daily: new Map(), latest: [] };
    agg.keywordIds.add(k.id);

    let latestPos: number | null = null;
    for (const r of k.rankings) {
      agg.clicks += r.clicks ?? 0;
      agg.impressions += r.impressions ?? 0;
      if (r.position !== null) {
        latestPos = r.position;
        const key = dayKey(r.date);
        const list = agg.daily.get(key) ?? [];
        list.push(r.position);
        agg.daily.set(key, list);
      }
    }
    agg.latest.push({
      keywordId: k.id,
      text: k.text,
      position: latestPos !== null ? round1(latestPos) : null,
    });
    pages.set(path, agg);
  }

  const result: PageRow[] = [];
  for (const [urlPath, agg] of pages) {
    const dates = Array.from(agg.daily.keys()).sort();
    const dailyAvg = dates.map((d) => {
      const list = agg.daily.get(d) as number[];
      return round1(list.reduce((a, b) => a + b, 0) / list.length);
    });

    const last = dailyAvg.length > 0 ? dailyAvg[dailyAvg.length - 1] : null;
    let change: number | null = null;
    if (last !== null) {
      const lastDate = new Date(`${dates[dates.length - 1]}T00:00:00.000Z`);
      let best: { distance: number; value: number } | null = null;
      for (let i = 0; i < dates.length; i++) {
        const daysAgo = differenceInCalendarDays(
          lastDate,
          new Date(`${dates[i]}T00:00:00.000Z`)
        );
        if (daysAgo < 5 || daysAgo > 10) continue;
        const distance = Math.abs(daysAgo - 7);
        if (!best || distance < best.distance) {
          best = { distance, value: dailyAvg[i] };
        }
      }
      if (best) change = round1(best.value - last);
    }

    const ranked = agg.latest.filter((k) => k.position !== null);
    const bestPosition =
      ranked.length > 0
        ? Math.min(...ranked.map((k) => k.position as number))
        : null;

    result.push({
      urlPath,
      keywordCount: agg.keywordIds.size,
      bestPosition,
      avgPosition: last,
      clicks: agg.clicks,
      impressions: agg.impressions,
      trend: dailyAvg.slice(-14),
      change,
      topKeywords: agg.latest
        .filter((k) => k.position !== null)
        .sort((a, b) => (a.position as number) - (b.position as number))
        .slice(0, 5)
        .map((k) => ({ id: k.keywordId, text: k.text, position: k.position })),
    });
  }

  return result.sort((a, b) => b.clicks - a.clicks);
}

// ---------------------------------------------------------------------------
// Visibility score (share of voice)
// ---------------------------------------------------------------------------

export async function getVisibility(
  projectId: number,
  days: number
): Promise<VisibilityData> {
  const rows = await prisma.keywordRanking.findMany({
    where: {
      keyword: { projectId },
      device: "desktop",
      position: { not: null },
      date: { gte: subDays(new Date(), days) },
    },
    select: { keywordId: true, position: true, date: true },
  });
  const totalKeywords = await prisma.keyword.count({ where: { projectId } });

  // score(date) = sum over keywords of ctrCurve(pos)/ctrCurve(1), as a
  // percentage of the tracked keyword set — 100 means every keyword is #1.
  const byDate = new Map<string, number>();
  for (const r of rows) {
    const key = dayKey(r.date);
    const weight = expectedCtr(r.position as number) / expectedCtr(1);
    byDate.set(key, (byDate.get(key) ?? 0) + weight);
  }

  const series = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sum]) => ({
      date,
      score:
        totalKeywords > 0 ? round1((sum / totalKeywords) * 100) : 0,
    }));

  const current = series.length > 0 ? series[series.length - 1].score : null;
  let weekChange: number | null = null;
  if (current !== null && series.length > 1) {
    const lastDate = new Date(`${series[series.length - 1].date}T00:00:00.000Z`);
    let best: { distance: number; score: number } | null = null;
    for (const p of series) {
      const daysAgo = differenceInCalendarDays(
        lastDate,
        new Date(`${p.date}T00:00:00.000Z`)
      );
      if (daysAgo < 5 || daysAgo > 10) continue;
      const distance = Math.abs(daysAgo - 7);
      if (!best || distance < best.distance) best = { distance, score: p.score };
    }
    if (best) weekChange = round1(current - best.score);
  }

  return {
    series,
    current,
    weekChange,
    annotations: await getAnnotations(projectId),
  };
}

// ---------------------------------------------------------------------------
// Keyword cannibalization
// ---------------------------------------------------------------------------

export async function getCannibalization(
  projectId: number
): Promise<CannibalizationGroup[]> {
  const since = subDays(new Date(), 14);
  const keywords = await prisma.keyword.findMany({
    where: { projectId, urlPath: { not: null } },
    include: {
      rankings: {
        where: { date: { gte: since }, device: "desktop" },
        orderBy: { date: "desc" },
        select: { position: true, clicks: true, impressions: true },
      },
    },
  });

  const byQuery = new Map<
    string,
    {
      keywordId: number;
      urlPath: string;
      position: number | null;
      clicks: number;
      impressions: number;
    }[]
  >();

  for (const k of keywords) {
    if (k.rankings.length === 0) continue; // no recent data = not competing
    const latestPos = k.rankings.find((r) => r.position !== null)?.position ?? null;
    const clicks = k.rankings.reduce((a, r) => a + (r.clicks ?? 0), 0);
    const impressions = k.rankings.reduce((a, r) => a + (r.impressions ?? 0), 0);
    const list = byQuery.get(k.text) ?? [];
    list.push({
      keywordId: k.id,
      urlPath: k.urlPath as string,
      position: latestPos !== null ? round1(latestPos) : null,
      clicks,
      impressions,
    });
    byQuery.set(k.text, list);
  }

  const groups: CannibalizationGroup[] = [];
  for (const [text, pages] of byQuery) {
    const distinctPaths = new Set(pages.map((p) => p.urlPath));
    if (distinctPaths.size < 2) continue;
    groups.push({
      text,
      pages: pages.sort((a, b) => {
        if (a.position === null) return 1;
        if (b.position === null) return -1;
        return a.position - b.position;
      }),
    });
  }

  // Most impressions at stake first
  return groups.sort(
    (a, b) =>
      b.pages.reduce((s, p) => s + p.impressions, 0) -
      a.pages.reduce((s, p) => s + p.impressions, 0)
  );
}
