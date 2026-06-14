"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Eye } from "lucide-react";
import { useCalendar } from "@/contexts/CalendarContext";
import { formatDateShort, formatDateLong } from "@/lib/jalaali";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { apiGet, errorMessage } from "@/lib/client";
import RangeSelector from "@/components/ui/RangeSelector";
import type { VisibilityData } from "@/lib/types";

function VisibilityTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  const { calendar } = useCalendar();
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs shadow-card-hover">
      <p className="font-semibold text-text-primary">
        {formatDateLong(String(label), calendar)}
      </p>
      <p className="mt-0.5 text-accent-blue">
        Visibility: {payload[0].value}%
      </p>
    </div>
  );
}

export default function VisibilityChart({ projectId }: { projectId: number }) {
  const { calendar } = useCalendar();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<VisibilityData | null>(null);

  useEffect(() => {
    const load = () => {
      apiGet<VisibilityData>(
        `/api/projects/${projectId}/visibility?days=${days}`
      )
        .then(setData)
        .catch((error) => toast.error(errorMessage(error)));
    };
    load();
    window.addEventListener("annotations-changed", load);
    window.addEventListener("project-synced", load);
    return () => {
      window.removeEventListener("annotations-changed", load);
      window.removeEventListener("project-synced", load);
    };
  }, [projectId, days]);

  const visibleAnnotations =
    data?.annotations.filter((a) =>
      data.series.some((p) => p.date >= a.date) &&
      data.series.some((p) => p.date <= a.date)
    ) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
      className="flex h-full flex-col rounded-xl border border-border-base bg-bg-card p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Eye size={15} className="text-accent-blue" />
            <h3 className="text-sm font-semibold text-text-primary">
              Visibility Score
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Share-of-voice style score — 100 means every keyword ranks #1
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.current !== null && data?.current !== undefined ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold tabular-nums text-accent-blue">
                {data.current}%
              </span>
              {data.weekChange !== null ? (
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    data.weekChange >= 0 ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {data.weekChange >= 0 ? "▲" : "▼"}
                  {Math.abs(data.weekChange).toFixed(1)} /wk
                </span>
              ) : null}
            </div>
          ) : null}
          <RangeSelector value={days} onChange={setDays} allowCustom />
        </div>
      </div>

      <div className="mt-4 h-56 flex-1">
        {data === null ? (
          <div className="h-full animate-pulse rounded-lg bg-bg-secondary" />
        ) : data.series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            Sync the project to start building visibility history.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.series}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="visibility-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0.02} />
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
                domain={[0, "auto"]}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<VisibilityTooltip />} />
              {visibleAnnotations.map((a) => (
                <ReferenceLine
                  key={a.id}
                  x={a.date}
                  stroke="var(--accent-yellow)"
                  strokeDasharray="4 3"
                />
              ))}
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--accent-blue)"
                strokeWidth={2}
                fill="url(#visibility-grad)"
                isAnimationActive
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {visibleAnnotations.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-base pt-3">
          {visibleAnnotations.slice(0, 4).map((a) => (
            <span key={a.id} className="text-xs text-text-secondary">
              <span className="text-accent-yellow">┊</span>{" "}
              {formatDateShort(a.date, calendar)} — {a.title}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
