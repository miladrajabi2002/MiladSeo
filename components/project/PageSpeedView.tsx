"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { Gauge, Smartphone, Monitor } from "lucide-react";
import { apiPost, errorMessage } from "@/lib/client";
import type { PageSpeedRow } from "@/lib/types";

interface PageSpeedViewProps {
  projectId: number;
  /** every distinct page path of the project */
  urlPaths: string[];
  results: PageSpeedRow[];
  onChanged: () => void;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-sm text-text-muted">–</span>;
  }
  const color =
    score >= 90
      ? "text-accent-green border-accent-green/40 bg-accent-green/10"
      : score >= 50
        ? "text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10"
        : "text-accent-red border-accent-red/40 bg-accent-red/10";
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums ${color}`}
    >
      {score}
    </span>
  );
}

function formatMs(value: number | null): string {
  if (value === null) return "–";
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

export default function PageSpeedView({
  projectId,
  urlPaths,
  results,
  onChanged,
}: PageSpeedViewProps) {
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [runningPath, setRunningPath] = useState<string | null>(null);

  const resultMap = new Map(
    results
      .filter((r) => r.strategy === strategy)
      .map((r) => [r.urlPath, r])
  );

  const run = async (urlPath: string) => {
    setRunningPath(urlPath);
    toast("Running PageSpeed audit — takes 10-20 seconds…", { icon: "⏱️" });
    try {
      await apiPost(`/api/projects/${projectId}/pagespeed`, {
        urlPaths: [urlPath],
        strategy,
      });
      toast.success("Audit complete");
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRunningPath(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
      className="rounded-xl border border-border-base bg-bg-card shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-base p-5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge size={15} className="text-accent-blue" />
            <h3 className="text-sm font-semibold text-text-primary">
              PageSpeed / Core Web Vitals
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Lighthouse performance score and lab metrics per page
          </p>
        </div>
        <div className="flex rounded-lg border border-border-base p-0.5">
          <button
            type="button"
            onClick={() => setStrategy("mobile")}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              strategy === "mobile"
                ? "bg-accent-blue text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Smartphone size={12} /> Mobile
          </button>
          <button
            type="button"
            onClick={() => setStrategy("desktop")}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              strategy === "desktop"
                ? "bg-accent-blue text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Monitor size={12} /> Desktop
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
              <th className="px-4 py-2.5">Page</th>
              <th className="px-4 py-2.5">Score</th>
              <th className="px-4 py-2.5">LCP</th>
              <th className="px-4 py-2.5">CLS</th>
              <th className="px-4 py-2.5">INP</th>
              <th className="px-4 py-2.5">TTFB</th>
              <th className="px-4 py-2.5">Checked</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {urlPaths.map((urlPath) => {
              const result = resultMap.get(urlPath);
              return (
                <tr
                  key={urlPath}
                  className="border-b border-border-base transition-colors last:border-0 hover:bg-bg-secondary"
                >
                  <td className="max-w-[260px] px-4 py-2.5">
                    <span className="block truncate font-mono text-xs text-text-primary">
                      {urlPath}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <ScoreBadge score={result?.score ?? null} />
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular-nums text-text-secondary">
                    {formatMs(result?.lcpMs ?? null)}
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular-nums text-text-secondary">
                    {result?.cls !== null && result?.cls !== undefined
                      ? result.cls.toFixed(3)
                      : "–"}
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular-nums text-text-secondary">
                    {formatMs(result?.inpMs ?? null)}
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular-nums text-text-secondary">
                    {formatMs(result?.ttfbMs ?? null)}
                  </td>
                  <td className="px-4 py-2.5 text-xs tabular-nums text-text-muted">
                    {result
                      ? format(parseISO(result.checkedAt), "MM/dd HH:mm")
                      : "never"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => void run(urlPath)}
                      disabled={runningPath !== null}
                      className="rounded-lg border border-border-base px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
                    >
                      {runningPath === urlPath ? "Running…" : "Run audit"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {urlPaths.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  No pages discovered yet — run a sync first.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
