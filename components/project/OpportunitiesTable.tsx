"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import GroupBadge from "@/components/ui/Badge";
import PositionBadge from "@/components/ui/PositionBadge";
import type { OpportunityRow } from "@/lib/types";

/**
 * Queries with healthy impressions but a CTR far below the curve for
 * their position — the cheapest wins: rewrite title/description.
 */
export default function OpportunitiesTable({
  rows,
}: {
  rows: OpportunityRow[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
      className="rounded-xl border border-border-base bg-bg-card shadow-card"
    >
      <div className="border-b border-border-base p-5 pb-4">
        <div className="flex items-center gap-2">
          <Lightbulb size={15} className="text-accent-yellow" />
          <h3 className="text-sm font-semibold text-text-primary">
            CTR Opportunities
          </h3>
          <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-text-secondary">
            {rows.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-text-muted">
          High impressions, low CTR for their position — improve the
          title/description of these pages
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-text-muted">
          No underperforming snippets found. Nice! 🎉
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-4 py-2.5">Keyword</th>
                <th className="px-4 py-2.5">Position</th>
                <th className="px-4 py-2.5">Impressions</th>
                <th className="px-4 py-2.5">Clicks</th>
                <th className="px-4 py-2.5">CTR</th>
                <th className="px-4 py-2.5">Expected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border-base transition-colors last:border-0 hover:bg-bg-secondary"
                >
                  <td className="max-w-[280px] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {row.text}
                        </p>
                        {row.urlPath ? (
                          <p className="truncate text-xs text-text-muted">
                            {row.urlPath}
                          </p>
                        ) : null}
                      </div>
                      {row.group ? <GroupBadge group={row.group} /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PositionBadge position={row.position} />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-text-primary">
                    {row.impressions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-text-secondary">
                    {row.clicks.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold tabular-nums text-accent-red">
                      {row.ctr}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-text-muted">
                    ~{row.expectedCtr}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
