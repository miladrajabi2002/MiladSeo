"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import GroupBadge from "@/components/ui/Badge";
import Sparkline from "@/components/ui/Sparkline";
import type { MoversData } from "@/lib/types";

export default function MoversDropsView({ movers }: { movers: MoversData }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Improved */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="overflow-hidden rounded-xl border border-border-base bg-bg-card shadow-card"
      >
        <h3 className="flex items-center gap-2 border-b border-border-base px-4 py-3 text-sm font-bold text-accent-green">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(34,197,94,0.12)]">
            <TrendingUp size={14} />
          </span>
          Improved Keywords
        </h3>
        {movers.improved.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-text-muted">
            No improved keywords this week.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2">Keyword</th>
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">Prev</th>
                  <th className="px-3 py-2">Now</th>
                  <th className="px-3 py-2">Δ</th>
                  <th className="px-3 py-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {movers.improved.map((row, index) => (
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
                    <td className="max-w-[150px] truncate px-3 py-2.5 font-medium text-text-primary">
                      {row.text}
                    </td>
                    <td className="px-3 py-2.5">
                      <GroupBadge group={row.group} />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-text-secondary">
                      {row.prevPos.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 font-bold tabular-nums text-accent-green">
                      {row.nowPos.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 font-semibold tabular-nums text-accent-green">
                      ▲ {row.delta.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Sparkline data={row.trend} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Dropped */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
        className="overflow-hidden rounded-xl border border-border-base bg-bg-card shadow-card"
      >
        <h3 className="flex items-center gap-2 border-b border-border-base px-4 py-3 text-sm font-bold text-accent-red">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(239,68,68,0.12)]">
            <TrendingDown size={14} />
          </span>
          Dropped Keywords
        </h3>
        {movers.dropped.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-text-muted">
            No dropped keywords this week. 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2">Keyword</th>
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">Prev</th>
                  <th className="px-3 py-2">Now</th>
                  <th className="px-3 py-2">Δ</th>
                  <th className="px-3 py-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {movers.dropped.map((row, index) => (
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
                    <td className="max-w-[150px] truncate px-3 py-2.5 font-medium text-text-primary">
                      {row.text}
                    </td>
                    <td className="px-3 py-2.5">
                      <GroupBadge group={row.group} />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-text-secondary">
                      {row.prevPos.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 font-bold tabular-nums text-accent-red">
                      {row.nowPos.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 font-semibold tabular-nums text-accent-red">
                      ▼ {Math.abs(row.delta).toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Sparkline data={row.trend} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
