"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { DistributionBucket } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border-base bg-bg-card px-3 py-2 text-sm shadow-card">
      <p className="font-semibold text-text-primary">Positions {label}</p>
      <p className="text-text-secondary">
        {payload[0].value} keyword{payload[0].value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function PositionDistributionChart({
  distribution,
}: {
  distribution: DistributionBucket[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
      className="rounded-xl border border-border-base bg-bg-card p-5 shadow-card"
    >
      <h3 className="text-sm font-semibold text-text-primary">
        Position Distribution — All Keywords
      </h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--border)", opacity: 0.3 }} />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
            >
              {distribution.map((bucket) => (
                <Cell key={bucket.bucket} fill={bucket.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
