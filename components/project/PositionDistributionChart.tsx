"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { BarChart3 } from "lucide-react";
import PositionLegend from "@/components/ui/PositionLegend";
import type { DistributionBucket } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload as DistributionBucket & { pct: number };
  return (
    <div className="rounded-lg border border-border-base bg-bg-card px-3 py-2 text-sm shadow-card-hover">
      <p className="flex items-center gap-1.5 font-semibold text-text-primary">
        <span
          className="h-2 w-2 rounded-sm"
          style={{ backgroundColor: entry.color }}
        />
        Positions {label}
      </p>
      <p className="mt-0.5 text-text-secondary">
        {entry.count} keyword{entry.count === 1 ? "" : "s"}
        <span className="ml-1.5 text-text-muted">({entry.pct}%)</span>
      </p>
    </div>
  );
}

export default function PositionDistributionChart({
  distribution,
}: {
  distribution: DistributionBucket[];
}) {
  const total = distribution.reduce((sum, b) => sum + b.count, 0);
  const data = distribution.map((b) => ({
    ...b,
    pct: total > 0 ? Math.round((b.count / total) * 100) : 0,
  }));
  const top10Count = distribution
    .filter((b) => b.bucket === "1-3" || b.bucket === "4-10")
    .reduce((sum, b) => sum + b.count, 0);
  const top10Pct = total > 0 ? Math.round((top10Count / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
      className="flex h-full flex-col rounded-xl border border-border-base bg-bg-card p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-accent-blue" />
            <h3 className="text-sm font-semibold text-text-primary">
              Position Distribution — All Keywords
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Where your {total} ranked keyword{total === 1 ? "" : "s"} sit in
            Google
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-base bg-bg-secondary px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              In Top 10
            </span>
            <span className="text-sm font-bold tabular-nums text-accent-green">
              {top10Pct}%
            </span>
          </div>
          <PositionLegend />
        </div>
      </div>

      <div className="mt-4 h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              {data.map((bucket, index) => (
                <linearGradient
                  key={bucket.bucket}
                  id={`bucket-grad-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={bucket.color} stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={bucket.color}
                    stopOpacity={0.45}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="bucket"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--border)", opacity: 0.3 }}
            />
            <Bar
              dataKey="count"
              radius={[5, 5, 0, 0]}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
            >
              <LabelList
                dataKey="count"
                position="top"
                fill="var(--text-secondary)"
                fontSize={11}
                fontWeight={600}
              />
              {data.map((bucket, index) => (
                <Cell key={bucket.bucket} fill={`url(#bucket-grad-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border-base pt-3">
        {data.map((bucket) => (
          <span
            key={bucket.bucket}
            className="flex items-center gap-1.5 text-xs text-text-secondary"
          >
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: bucket.color }}
            />
            {bucket.bucket}
            <span className="tabular-nums text-text-muted">
              {bucket.pct}%
            </span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
