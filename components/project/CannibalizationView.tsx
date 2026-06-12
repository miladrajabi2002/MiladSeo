"use client";

import { motion } from "framer-motion";
import { Split } from "lucide-react";
import PositionBadge from "@/components/ui/PositionBadge";
import type { CannibalizationGroup } from "@/lib/types";

/**
 * Queries where two or more URLs of the site rank at the same time —
 * they split authority and usually both rank worse than one page would.
 */
export default function CannibalizationView({
  groups,
}: {
  groups: CannibalizationGroup[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
      className="rounded-xl border border-border-base bg-bg-card shadow-card"
    >
      <div className="border-b border-border-base p-5 pb-4">
        <div className="flex items-center gap-2">
          <Split size={15} className="text-accent-red" />
          <h3 className="text-sm font-semibold text-text-primary">
            Keyword Cannibalization
          </h3>
          <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-text-secondary">
            {groups.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-text-muted">
          Multiple pages competing for the same query — consolidate or
          differentiate them
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="p-8 text-center text-sm text-text-muted">
          No cannibalization detected — each query maps to one page. 👌
        </p>
      ) : (
        <div className="divide-y divide-border-base">
          {groups.map((group) => (
            <div key={group.text} className="p-4">
              <p className="text-sm font-semibold text-text-primary">
                “{group.text}”
                <span className="ml-2 text-xs font-normal text-text-muted">
                  {group.pages.length} competing pages
                </span>
              </p>
              <div className="mt-2 space-y-1.5">
                {group.pages.map((page, index) => (
                  <div
                    key={page.keywordId}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                      index === 0
                        ? "border-accent-green/40 bg-accent-green/5"
                        : "border-border-base"
                    }`}
                  >
                    <PositionBadge position={page.position} />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">
                      {page.urlPath}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-text-muted">
                      {page.clicks} clicks ·{" "}
                      {page.impressions.toLocaleString()} impr.
                    </span>
                    {index === 0 ? (
                      <span className="shrink-0 rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-green">
                        Primary
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
