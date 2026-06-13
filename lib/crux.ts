import axios from "axios";
import { prisma } from "./prisma";
import type { CruxData, CruxPoint } from "./types";

const ENDPOINT = "https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord";

const METRICS = [
  "largest_contentful_paint",
  "interaction_to_next_paint",
  "cumulative_layout_shift",
] as const;

interface PeriodDate {
  year: number;
  month: number;
  day: number;
}

interface HistoryResponse {
  record?: {
    metrics?: Record<string, { percentilesTimeseries?: { p75s?: (string | number | null)[] } }>;
    collectionPeriods?: { firstDate: PeriodDate; lastDate: PeriodDate }[];
  };
}

function dateStr(d: PeriodDate): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pulls up to ~25 weeks of real-user Core Web Vitals (p75) for the project's
 * origin from the Chrome UX Report API. Reuses PAGESPEED_API_KEY (a Google
 * Cloud key with the Chrome UX Report API enabled — both are free).
 */
export async function getCruxHistory(
  projectId: number,
  formFactor: "PHONE" | "DESKTOP" = "PHONE"
): Promise<CruxData> {
  const key = process.env.PAGESPEED_API_KEY || process.env.CRUX_API_KEY;
  if (!key) {
    throw new Error(
      "Set PAGESPEED_API_KEY in .env (a free Google Cloud key with the Chrome UX Report API enabled) to load field data."
    );
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);
  const origin = `https://${project.domain.replace(/\/$/, "")}`;

  let response;
  try {
    response = await axios.post<HistoryResponse>(
      `${ENDPOINT}?key=${key}`,
      { origin, formFactor, metrics: METRICS },
      { timeout: 30_000, validateStatus: () => true }
    );
  } catch {
    throw new Error("Could not reach the Chrome UX Report API");
  }

  if (response.status === 404) {
    throw new Error("Not enough real-user data in CrUX for this site yet");
  }
  if (response.status >= 400) {
    const apiMessage = (response.data as { error?: { message?: string } })?.error?.message;
    throw new Error(apiMessage || `CrUX API error (${response.status})`);
  }

  const record = response.data.record;
  const periods = record?.collectionPeriods ?? [];
  const lcp = record?.metrics?.largest_contentful_paint?.percentilesTimeseries?.p75s ?? [];
  const inp = record?.metrics?.interaction_to_next_paint?.percentilesTimeseries?.p75s ?? [];
  const cls = record?.metrics?.cumulative_layout_shift?.percentilesTimeseries?.p75s ?? [];

  const series: CruxPoint[] = periods.map((p, i) => ({
    date: dateStr(p.lastDate),
    lcp: num(lcp[i]),
    inp: num(inp[i]),
    cls: num(cls[i]),
  }));

  const last = series[series.length - 1] ?? null;
  return { origin, formFactor, series, latest: last };
}
