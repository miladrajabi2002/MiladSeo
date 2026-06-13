"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Smartphone, Monitor } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGet, errorMessage } from "@/lib/client";
import type { CruxData } from "@/lib/types";

type FormFactor = "PHONE" | "DESKTOP";

interface Threshold {
  good: number;
  poor: number;
}

const THRESHOLDS: Record<"lcp" | "inp" | "cls", Threshold> = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
};

function rating(metric: "lcp" | "inp" | "cls", value: number | null): string {
  if (value === null) return "text-text-muted";
  const t = THRESHOLDS[metric];
  if (value <= t.good) return "text-accent-green";
  if (value <= t.poor) return "text-accent-yellow";
  return "text-accent-red";
}

function fmt(metric: "lcp" | "inp" | "cls", value: number | null): string {
  if (value === null) return "—";
  if (metric === "cls") return value.toFixed(2);
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
}

function MetricCard({
  label,
  metric,
  value,
}: {
  label: string;
  metric: "lcp" | "inp" | "cls";
  value: number | null;
}) {
  return (
    <div className="rounded-xl bg-bg-secondary px-3 py-2.5">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${rating(metric, value)}`}>
        {fmt(metric, value)}
      </p>
    </div>
  );
}

export default function CruxView({ projectId }: { projectId: number }) {
  const [formFactor, setFormFactor] = useState<FormFactor>("PHONE");
  const [data, setData] = useState<CruxData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    apiGet<CruxData>(`/api/projects/${projectId}/crux?formFactor=${formFactor}`)
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [projectId, formFactor]);

  const latest = data?.latest ?? null;

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
            <Gauge size={15} className="text-accent-blue" />
            <h3 className="text-sm font-semibold text-text-primary">
              Core Web Vitals — real users (CrUX)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            28-day rolling p75 field data from Chrome users, by week
          </p>
        </div>
        <div className="flex rounded-lg border border-border-base p-0.5">
          {(["PHONE", "DESKTOP"] as const).map((ff) => (
            <button
              key={ff}
              type="button"
              onClick={() => setFormFactor(ff)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                formFactor === ff
                  ? "bg-accent-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {ff === "PHONE" ? <Smartphone size={12} /> : <Monitor size={12} />}
              {ff === "PHONE" ? "Mobile" : "Desktop"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-bg-secondary px-3 py-4 text-center text-sm text-text-muted">
          {error}
        </p>
      ) : data === null ? (
        <div className="mt-4 h-44 animate-pulse rounded-lg bg-bg-secondary" />
      ) : data.series.length === 0 ? (
        <p className="mt-4 text-center text-sm text-text-muted">
          No field data available for this site yet.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MetricCard label="LCP (loading)" metric="lcp" value={latest?.lcp ?? null} />
            <MetricCard label="INP (responsiveness)" metric="inp" value={latest?.inp ?? null} />
            <MetricCard label="CLS (stability)" metric="cls" value={latest?.cls ?? null} />
          </div>

          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="ms"
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
                  formatter={(value: number, name: string) =>
                    name === "cls" ? value.toFixed(2) : `${Math.round(value)}ms`
                  }
                />
                <Line yAxisId="ms" type="monotone" dataKey="lcp" name="LCP" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                <Line yAxisId="ms" type="monotone" dataKey="inp" name="INP" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-[11px] text-text-muted">
            LCP <span className="text-accent-blue">━</span> · INP{" "}
            <span className="text-accent-green">━</span> (lower is better)
          </p>
        </>
      )}
    </motion.div>
  );
}
