"use client";

import { useEffect, useState } from "react";
import { LineChart as LineIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCalendar } from "@/contexts/CalendarContext";
import { formatDateShort } from "@/lib/jalaali";
import { apiGet } from "@/lib/client";
import type { PageSpeedHistoryPoint } from "@/lib/types";

interface Props {
  projectId: number;
  strategy: "mobile" | "desktop";
}

/** Project-wide daily PageSpeed score trend (averaged across audited URLs). */
export default function PageSpeedHistoryChart({ projectId, strategy }: Props) {
  const { calendar } = useCalendar();
  const [points, setPoints] = useState<PageSpeedHistoryPoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<PageSpeedHistoryPoint[]>(
      `/api/projects/${projectId}/pagespeed/history?strategy=${strategy}`
    )
      .then((d) => {
        if (!cancelled) setPoints(d);
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, strategy]);

  if (points === null) {
    return <div className="h-40 animate-pulse rounded-lg bg-bg-secondary" />;
  }
  if (points.length < 2) {
    return (
      <p className="rounded-lg border border-dashed border-border-base bg-bg-secondary/40 px-4 py-6 text-center text-xs text-text-muted">
        Run audits on more than one day to see the performance trend over time.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border-base bg-bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <LineIcon size={15} className="text-accent-blue" />
        <h3 className="text-sm font-semibold text-text-primary">
          Performance trend ({strategy})
        </h3>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
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
              domain={[0, 100]}
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
            <Line
              type="monotone"
              dataKey="score"
              name="Score"
              stroke="var(--accent-blue)"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
