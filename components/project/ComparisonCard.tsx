"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { GitCompareArrows } from "lucide-react";
import { apiGet, errorMessage } from "@/lib/client";
import type { ComparisonData, PeriodStats } from "@/lib/types";

interface MetricDef {
  label: string;
  value: (p: PeriodStats) => number | null;
  format: (v: number) => string;
  /** true when a smaller value is the improvement (avg position) */
  lowerIsBetter?: boolean;
}

const METRICS: MetricDef[] = [
  {
    label: "Avg Position",
    value: (p) => p.avgPosition,
    format: (v) => v.toFixed(1),
    lowerIsBetter: true,
  },
  { label: "Top 3", value: (p) => p.top3, format: (v) => String(v) },
  { label: "Top 10", value: (p) => p.top10, format: (v) => String(v) },
  {
    label: "Clicks",
    value: (p) => p.clicks,
    format: (v) => v.toLocaleString(),
  },
  {
    label: "Impressions",
    value: (p) => p.impressions,
    format: (v) => v.toLocaleString(),
  },
  {
    label: "CTR",
    value: (p) => p.ctr,
    format: (v) => `${v.toFixed(1)}%`,
  },
];

function MetricDelta({
  metric,
  data,
}: {
  metric: MetricDef;
  data: ComparisonData;
}) {
  const current = metric.value(data.current);
  const previous = metric.value(data.previous);

  let deltaNode: React.ReactNode = (
    <span className="text-xs text-text-muted">—</span>
  );
  if (current !== null && previous !== null) {
    const diff = current - previous;
    const improved = metric.lowerIsBetter ? diff < 0 : diff > 0;
    if (diff === 0) {
      deltaNode = <span className="text-xs text-text-muted">±0</span>;
    } else {
      deltaNode = (
        <span
          className={`text-xs font-semibold tabular-nums ${
            improved ? "text-accent-green" : "text-accent-red"
          }`}
        >
          {improved ? "▲" : "▼"} {metric.format(Math.abs(diff))}
        </span>
      );
    }
  }

  return (
    <div className="rounded-lg border border-border-base bg-bg-secondary p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {metric.label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
        {current !== null ? metric.format(current) : "–"}
      </p>
      <p className="mt-0.5 flex items-center gap-1">
        {deltaNode}
        <span className="text-[10px] text-text-muted">
          vs {previous !== null ? metric.format(previous) : "–"}
        </span>
      </p>
    </div>
  );
}

export default function ComparisonCard({ projectId }: { projectId: number }) {
  const [range, setRange] = useState<"week" | "month">("week");
  const [data, setData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    setData(null);
    apiGet<ComparisonData>(`/api/projects/${projectId}/compare?range=${range}`)
      .then(setData)
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId, range]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
      className="rounded-xl border border-border-base bg-bg-card p-5 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitCompareArrows size={15} className="text-accent-blue" />
          <h3 className="text-sm font-semibold text-text-primary">
            {data ? `${data.current.label} vs ${data.previous.label}` : "Period Comparison"}
          </h3>
        </div>
        <div className="flex rounded-lg border border-border-base p-0.5">
          {(["week", "month"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                range === r
                  ? "bg-accent-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {data === null ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="h-[88px] animate-pulse rounded-lg bg-bg-secondary"
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {METRICS.map((m) => (
            <MetricDelta key={m.label} metric={m} data={data} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
