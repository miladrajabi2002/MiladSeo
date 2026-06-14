"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCalendar } from "@/contexts/CalendarContext";
import { formatDateShort } from "@/lib/jalaali";
import { apiGet } from "@/lib/client";
import type { IndexCoveragePoint } from "@/lib/types";

/** Daily index-coverage trend (indexed / excluded / not-indexed counts). */
export default function IndexCoverageChart({ projectId }: { projectId: number }) {
  const { calendar } = useCalendar();
  const [points, setPoints] = useState<IndexCoveragePoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      apiGet<IndexCoveragePoint[]>(`/api/projects/${projectId}/index-status/history`)
        .then((d) => {
          if (!cancelled) setPoints(d);
        })
        .catch(() => {
          if (!cancelled) setPoints([]);
        });
    };
    load();
    window.addEventListener("project-synced", load);
    return () => {
      cancelled = true;
      window.removeEventListener("project-synced", load);
    };
  }, [projectId]);

  if (points === null) {
    return <div className="h-40 animate-pulse rounded-lg bg-bg-secondary" />;
  }
  if (points.length < 2) {
    return (
      <p className="rounded-lg border border-dashed border-border-base bg-bg-secondary/40 px-4 py-6 text-center text-xs text-text-muted">
        Check index coverage on more than one day to chart the trend.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border-base bg-bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={15} className="text-accent-green" />
        <h3 className="text-sm font-semibold text-text-primary">Index coverage trend</h3>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
              tickFormatter={(d: string) => formatDateShort(d, calendar)}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(d) => formatDateShort(String(d), calendar)}
            />
            <Area
              type="monotone"
              stackId="cov"
              dataKey="pass"
              name="Indexed"
              stroke="var(--accent-green)"
              fill="var(--accent-green)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              stackId="cov"
              dataKey="neutral"
              name="Excluded"
              stroke="var(--accent-yellow)"
              fill="var(--accent-yellow)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              stackId="cov"
              dataKey="fail"
              name="Not indexed"
              stroke="var(--accent-red)"
              fill="var(--accent-red)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
