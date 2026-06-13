import { google } from "googleapis";
import { prisma } from "./prisma";
import { getAuthorizedClient } from "./gsc";
import type { Ga4Property, Ga4Summary } from "./types";

/**
 * Lists every GA4 property the connected Google account can read, via the
 * Analytics Admin API account summaries endpoint.
 */
export async function listGa4Properties(): Promise<Ga4Property[]> {
  const auth = await getAuthorizedClient();
  const admin = google.analyticsadmin({ version: "v1beta", auth });
  const res = await admin.accountSummaries.list({ pageSize: 200 });

  const properties: Ga4Property[] = [];
  for (const account of res.data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      if (!prop.property) continue;
      properties.push({
        property: prop.property, // "properties/123456789"
        displayName: prop.displayName ?? prop.property,
        account: account.displayName ?? "",
      });
    }
  }
  return properties.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function ymd(daysAgo: number): string {
  return `${daysAgo}daysAgo`;
}

/** Pulls a GA4 summary (totals, daily series, channels, top pages) for a project. */
export async function getGa4Summary(
  projectId: number,
  days: number
): Promise<Ga4Summary> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);
  if (!project.ga4PropertyId) {
    throw new Error("No GA4 property linked to this project");
  }

  const auth = await getAuthorizedClient();
  const data = google.analyticsdata({ version: "v1beta", auth });
  const startDate = ymd(days);
  const property = project.ga4PropertyId;

  // 1) Daily time series of core metrics
  const trendReq = data.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "conversions" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: "400",
    },
  });

  // 2) Channel breakdown
  const channelReq = data.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "10",
    },
  });

  // 3) Top landing pages
  const pagesReq = data.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "landingPage" }],
      metrics: [
        { name: "sessions" },
        { name: "conversions" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "15",
    },
  });

  // 4) Engagement totals
  const totalsReq = data.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "conversions" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
    },
  });

  const [trend, channels, pages, totals] = await Promise.all([
    trendReq,
    channelReq,
    pagesReq,
    totalsReq,
  ]);

  const series = (trend.data.rows ?? []).map((row) => {
    const raw = row.dimensionValues?.[0]?.value ?? "";
    const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
    const m = row.metricValues ?? [];
    return {
      date,
      sessions: Number(m[0]?.value ?? 0),
      users: Number(m[1]?.value ?? 0),
      pageviews: Number(m[2]?.value ?? 0),
      conversions: Number(m[3]?.value ?? 0),
    };
  });

  const channelRows = (channels.data.rows ?? []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? "(unknown)",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }));

  const topPages = (pages.data.rows ?? []).map((row) => {
    const m = row.metricValues ?? [];
    return {
      page: row.dimensionValues?.[0]?.value ?? "",
      sessions: Number(m[0]?.value ?? 0),
      conversions: Number(m[1]?.value ?? 0),
      avgDuration: Math.round(Number(m[2]?.value ?? 0)),
    };
  });

  const t = totals.data.rows?.[0]?.metricValues ?? [];
  return {
    propertyId: property,
    days,
    totals: {
      sessions: Number(t[0]?.value ?? 0),
      users: Number(t[1]?.value ?? 0),
      newUsers: Number(t[2]?.value ?? 0),
      conversions: Number(t[3]?.value ?? 0),
      avgSessionDuration: Math.round(Number(t[4]?.value ?? 0)),
      bounceRate: Math.round(Number(t[5]?.value ?? 0) * 1000) / 10,
    },
    series,
    channels: channelRows,
    topPages,
  };
}
