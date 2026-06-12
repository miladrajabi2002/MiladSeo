"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import Modal from "@/components/ui/Modal";
import GroupBadge from "@/components/ui/Badge";
import { ChartSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, errorMessage } from "@/lib/client";
import type { KeywordHistory } from "@/lib/types";

interface KeywordTrendModalProps {
  projectId: number;
  keywordId: number | null;
  onClose: () => void;
}

function TrendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as {
    desktopPos: number | null;
    mobilePos: number | null;
    clicks: number;
    impressions: number;
  };
  return (
    <div className="rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs shadow-card-hover">
      <p className="font-semibold text-text-primary">
        {format(parseISO(String(label)), "MMM d, yyyy")}
      </p>
      <p className="mt-1 text-accent-blue">
        Desktop: {point.desktopPos !== null ? point.desktopPos.toFixed(1) : "–"}
      </p>
      <p className="text-accent-yellow">
        Mobile: {point.mobilePos !== null ? point.mobilePos.toFixed(1) : "–"}
      </p>
      <p className="mt-1 text-text-secondary">
        {point.clicks} clicks · {point.impressions.toLocaleString()} impressions
      </p>
    </div>
  );
}

export default function KeywordTrendModal({
  projectId,
  keywordId,
  onClose,
}: KeywordTrendModalProps) {
  const [days, setDays] = useState<30 | 90>(30);
  const [history, setHistory] = useState<KeywordHistory | null>(null);

  useEffect(() => {
    if (keywordId === null) {
      setHistory(null);
      return;
    }
    setHistory(null);
    apiGet<KeywordHistory>(
      `/api/projects/${projectId}/keywords/${keywordId}/history?days=${days}`
    )
      .then(setHistory)
      .catch((error) => {
        toast.error(errorMessage(error));
        onClose();
      });
  }, [projectId, keywordId, days, onClose]);

  const annotationDates = new Set(
    (history?.annotations ?? []).map((a) => a.date)
  );

  return (
    <Modal
      open={keywordId !== null}
      onClose={onClose}
      title={history ? history.text : "Loading…"}
      wide
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {history?.group ? <GroupBadge group={history.group} /> : null}
          {history?.urlPath ? (
            <span className="truncate font-mono">{history.urlPath}</span>
          ) : null}
        </div>
        <div className="flex rounded-lg border border-border-base p-0.5">
          {([30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                days === d
                  ? "bg-accent-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-72">
        {history === null ? (
          <ChartSkeleton />
        ) : history.points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No ranking history in this window yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={history.points}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
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
              {/* Lower position = better, so the axis is reversed */}
              <YAxis
                reversed
                domain={[1, "auto"]}
                allowDecimals={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TrendTooltip />} />
              {history.annotations
                .filter((a) =>
                  history.points.some((p) => p.date >= a.date) &&
                  history.points.some((p) => p.date <= a.date)
                )
                .map((a) => (
                  <ReferenceLine
                    key={a.id}
                    x={a.date}
                    stroke="var(--accent-yellow)"
                    strokeDasharray="4 3"
                    label={{
                      value: "📌",
                      position: "top",
                      fontSize: 12,
                    }}
                  />
                ))}
              <Line
                type="monotone"
                dataKey="desktopPos"
                name="Desktop"
                stroke="var(--accent-blue)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="mobilePos"
                name="Mobile"
                stroke="var(--accent-yellow)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border-base pt-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-accent-blue" /> Desktop
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-b-2 border-dashed border-accent-yellow" />{" "}
          Mobile
        </span>
        {annotationDates.size > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="text-accent-yellow">┊</span> Annotation
          </span>
        ) : null}
      </div>
    </Modal>
  );
}
