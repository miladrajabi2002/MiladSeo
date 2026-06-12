"use client";

import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import PositionBadge from "@/components/ui/PositionBadge";
import DeltaBadge from "@/components/ui/DeltaBadge";
import Sparkline from "@/components/ui/Sparkline";
import type { PageRow } from "@/lib/types";

export default function PagesTable({ rows }: { rows: PageRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-x-auto rounded-xl border border-border-base bg-bg-card shadow-card"
    >
      <table className="w-full min-w-[860px] text-left">
        <thead>
          <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
            <th className="px-4 py-3">Page</th>
            <th className="px-4 py-3">Keywords</th>
            <th className="px-4 py-3">Best Pos</th>
            <th className="px-4 py-3">Avg Pos</th>
            <th className="px-4 py-3">Change</th>
            <th className="px-4 py-3">Trend</th>
            <th className="px-4 py-3">Clicks</th>
            <th className="px-4 py-3">Impressions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = expanded === row.urlPath;
            return (
              <Fragment key={row.urlPath}>
                <tr
                  onClick={() => setExpanded(isOpen ? null : row.urlPath)}
                  className="cursor-pointer border-b border-border-base transition-colors last:border-0 hover:bg-bg-secondary"
                >
                  <td className="max-w-[300px] px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown size={14} className="shrink-0 text-text-muted" />
                      ) : (
                        <ChevronRight size={14} className="shrink-0 text-text-muted" />
                      )}
                      <FileText size={14} className="shrink-0 text-accent-blue" />
                      <span className="truncate font-mono text-xs font-semibold text-text-primary">
                        {row.urlPath}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-text-primary">
                    {row.keywordCount}
                  </td>
                  <td className="px-4 py-3">
                    <PositionBadge position={row.bestPosition} />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-text-secondary">
                    {row.avgPosition !== null ? row.avgPosition.toFixed(1) : "–"}
                  </td>
                  <td className="px-4 py-3">
                    <DeltaBadge delta={row.change} />
                  </td>
                  <td className="px-4 py-3">
                    <Sparkline data={row.trend} />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-text-primary">
                    {row.clicks.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-text-secondary">
                    {row.impressions.toLocaleString()}
                  </td>
                </tr>
                {isOpen ? (
                  <tr className="border-b border-border-base bg-bg-secondary/60">
                    <td colSpan={8} className="px-4 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Top keywords for this page
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {row.topKeywords.map((k) => (
                          <span
                            key={k.id}
                            className="flex items-center gap-2 rounded-lg border border-border-base bg-bg-card px-3 py-1.5"
                          >
                            <PositionBadge position={k.position} />
                            <span className="text-xs font-medium text-text-primary">
                              {k.text}
                            </span>
                          </span>
                        ))}
                        {row.topKeywords.length === 0 ? (
                          <span className="text-xs text-text-muted">
                            No ranked keywords in the last 30 days
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-12 text-center text-sm text-text-muted"
              >
                No page data yet — run a sync to import pages from Search
                Console.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </motion.div>
  );
}
