"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import GroupBadge from "@/components/ui/Badge";
import PositionBadge from "@/components/ui/PositionBadge";
import DeltaBadge from "@/components/ui/DeltaBadge";
import type { KeywordRow } from "@/lib/types";

interface RankStyle {
  bg: string;
  text: string;
  ring: string;
}

const RANK_STYLES: RankStyle[] = [
  {
    bg: "linear-gradient(135deg, #fbbf24, #d97706)",
    text: "#ffffff",
    ring: "rgba(251, 191, 36, 0.35)",
  },
  {
    bg: "linear-gradient(135deg, #cbd5e1, #94a3b8)",
    text: "#ffffff",
    ring: "rgba(148, 163, 184, 0.35)",
  },
  {
    bg: "linear-gradient(135deg, #f59e0b, #b45309)",
    text: "#ffffff",
    ring: "rgba(180, 83, 9, 0.3)",
  },
];

function rankStyle(index: number): React.CSSProperties {
  const style = RANK_STYLES[index];
  if (style) {
    return {
      background: style.bg,
      color: style.text,
      boxShadow: `0 0 0 3px ${style.ring}`,
    };
  }
  return {
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  };
}

export default function TopKeywords({ keywords }: { keywords: KeywordRow[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.25 }}
      className="flex h-full flex-col rounded-xl border border-border-base bg-bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-2">
        <Trophy size={15} className="text-accent-yellow" />
        <h3 className="text-sm font-semibold text-text-primary">
          Top 5 Best-Ranking Keywords
        </h3>
      </div>
      <p className="mt-0.5 text-xs text-text-muted">
        Your strongest desktop positions right now
      </p>

      {keywords.length === 0 ? (
        <p className="mt-6 text-center text-sm text-text-muted">
          No ranked keywords yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-1 flex-col gap-2">
          {keywords.map((keyword, index) => (
            <motion.li
              key={keyword.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.3 + index * 0.08,
                ease: "easeOut",
              }}
              whileHover={{ x: 3 }}
              className="flex items-center gap-3 rounded-lg border border-border-base bg-bg-secondary/50 px-3 py-2.5"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums"
                style={rankStyle(index)}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {keyword.text}
                  </p>
                  {keyword.group ? <GroupBadge group={keyword.group} /> : null}
                </div>
                {keyword.urlPath ? (
                  <p className="truncate text-xs text-text-muted">
                    {keyword.urlPath}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DeltaBadge delta={keyword.change} />
                <PositionBadge position={keyword.desktopPos} />
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
