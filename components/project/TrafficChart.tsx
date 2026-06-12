"use client";

import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { MousePointerClick } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { TrafficPoint } from "@/lib/types";

interface TrafficChartProps {
  series: TrafficPoint[];
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number | null;
}

function TrafficTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as TrafficPoint;
  return (
    <div className="rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs shadow-card-hover">
      <p className="font-semibold text-text-primary">
        {format(parseISO(String(label)), "MMM d, yyyy")}
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
              Clicks & Impressions
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Search Console traffic, all tracked queries combined
          </p>
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
                tickFormatter={(d: string) => format(parseISO(d), "MM/dd")}
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
              />
              <YAxis
                yAxisId="impressions"
                orientation="right"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<TrafficTooltip />} />
              <Area
                yAxisId="impressions"
                type="monotone"
                dataKey="impressions"
                stroke="var(--accent-yellow)"
                strokeWidth={1.5}
                fill="url(#impr-grad)"
              />
              <Area
                yAxisId="clicks"
                type="monotone"
                dataKey="clicks"
                stroke="var(--accent-blue)"
                strokeWidth={2}
                fill="url(#clicks-grad)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-base pt-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-accent-blue" /> Clicks (left)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-accent-yellow" /> Impressions
          (right)
        </span>
      </div>
    </motion.div>
  );
}
