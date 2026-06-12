"use client";

import { motion } from "framer-motion";
import GroupBadge from "@/components/ui/Badge";
import PositionBadge from "@/components/ui/PositionBadge";
import type { MobileRow } from "@/lib/types";

export default function MobileComparisonTable({ rows }: { rows: MobileRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border-base bg-bg-card p-10 text-center text-sm text-text-muted shadow-card">
        No keywords with both mobile and desktop data yet. Run a sync first.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-base bg-bg-card shadow-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
            <th className="px-4 py-3">Keyword</th>
            <th className="px-4 py-3">Mobile</th>
            <th className="px-4 py-3">Desktop</th>
            <th className="px-4 py-3">Gap</th>
            <th className="px-4 py-3">Group</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(index * 0.03, 0.5),
                ease: "easeOut",
              }}
              className="border-b border-border-base last:border-0 hover:bg-bg-secondary"
            >
              <td className="max-w-[220px] truncate px-4 py-2.5 font-medium text-text-primary">
                {row.text}
              </td>
              <td className="px-4 py-2.5">
                <PositionBadge position={row.mobilePos} />
              </td>
              <td className="px-4 py-2.5">
                <PositionBadge position={row.desktopPos} />
              </td>
              <td
                className={`px-4 py-2.5 font-semibold tabular-nums ${
                  row.gap < 0
                    ? "text-accent-green"
                    : row.gap > 0
                      ? "text-accent-red"
                      : "text-text-muted"
                }`}
              >
                {row.gap > 0 ? "+" : ""}
                {row.gap.toFixed(1)}
              </td>
              <td className="px-4 py-2.5">
                <GroupBadge group={row.group} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
