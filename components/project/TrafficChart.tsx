"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import { useCalendar } from "@/contexts/CalendarContext";
import { formatDateShort, formatDateLong } from "@/lib/jalaali";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { TrafficPoint } from "@/lib/types";

type Metric = "both" | "clicks" | "impressions" | "ctr";

interface TrafficChartProps {
  series: TrafficPoint[];
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number | null;
}

function TrafficTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { calendar } = useCalendar();
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as TrafficPoint;
  return (
    <div className="rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs shadow-card-hover">
      <p className="font-semibold text-text-primary">
        {formatDateLong(String(label), calendar)}
      </p>
      <p className="mt-0.5 text-accent-blue">{point.clicks} clicks</p>
      <p className="text-accent-yellow">
        {point.impressions.toLocaleString()} impressions
      </p>
      {point.ctr !== null ? (
        <p className="text-text-secondary">CTR {point.ctr}%</p>
      ) : null}
    </div>
  );
}

export default function TrafficChart({
  series,
  totalClicks,
  totalImpressions,
  avgCtr,
}: TrafficChartProps) {
  const { calendar } = useCalendar();
  const [metric, setMetric] = useState<Metric>("both");

  const METRIC_TABS: { key: Metric; label: string }[] = [
    { key: "both", label: "Both" },
    { key: "clicks", label: "Clicks" },
    { key: "impressions", label: "Impressions" },
    { key: "ctr", label: "CTR" },
  ];

  const showClicks = metric === "both" || metric === "clicks";
  const showImpr = metric === "both" || metric === "impressions";
  const showCtr = metric === "ctr";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-border-base bg-bg-card p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <MousePointerClick size={15} className="text-accent-blue" />
            <h3 className="text-sm font-semibold text-text-primary">
              Clicks, Impressions &amp; CTR
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Search Console traffic, all tracked queries combined
          </p>
          <div className="mt-2 flex rounded-lg border border-border-base p-0.5">
            {METRIC_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setMetric(t.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  metric === t.key
                    ? "bg-accent-blue text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="rounded-lg border border-border-base bg-bg-secondary px-3 py-1.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Clicks
            </p>
            <p className="text-sm font-bold tabular-nums text-accent-blue">
              {totalClicks.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border-base bg-bg-secondary px-3 py-1.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Impressions
            </p>
            <p className="text-sm font-bold tabular-nums text-accent-yellow">
              {totalImpressions.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border-base bg-bg-secondary px-3 py-1.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Avg CTR
            </p>
            <p className="text-sm font-bold tabular-nums text-text-primary">
              {avgCtr !== null ? `${avgCtr}%` : "–"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-64">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No traffic data yet — run a sync first.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ top: 8, right: -10, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="clicks-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="impr-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-yellow)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--accent-yellow)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                tickFormatter={(d: string) => formatDateShort(d, calendar)}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                yAxisId="clicks"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                hide={!showClicks && !showCtr}
                unit={showCtr ? "%" : undefined}
                domain={showCtr ? [0, "auto"] : undefined}
              />
              <YAxis
                yAxisId="impressions"
                orientation="right"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                hide={!showImpr}
              />
              <Tooltip content={<TrafficTooltip />} />
              {showImpr ? (
                <Area
                  yAxisId="impressions"
                  type="monotone"
                  dataKey="impressions"
                  stroke="var(--accent-yellow)"
                  strokeWidth={1.5}
                  fill="url(#impr-grad)"
                />
              ) : null}
              {showClicks ? (
                <Area
                  yAxisId="clicks"
                  type="monotone"
                  dataKey="clicks"
                  stroke="var(--accent-blue)"
                  strokeWidth={2}
                  fill="url(#clicks-grad)"
                />
              ) : null}
              {showCtr ? (
                <Line
                  yAxisId="clicks"
                  type="monotone"
                  dataKey="ctr"
                  stroke="var(--accent-green)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-base pt-3 text-xs text-text-secondary">
        {showClicks ? (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-accent-blue" /> Clicks (left)
          </span>
        ) : null}
        {showImpr ? (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-accent-yellow" /> Impressions
            (right)
          </span>
        ) : null}
        {showCtr ? (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-accent-green" /> CTR (%)
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
