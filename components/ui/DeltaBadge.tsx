"use client";

import { motion } from "framer-motion";

interface DeltaBadgeProps {
  /** Positive = improved (moved up), negative = dropped */
  delta: number | null | undefined;
}

export default function DeltaBadge({ delta }: DeltaBadgeProps) {
  if (delta === null || delta === undefined) {
    return <span className="text-sm text-text-muted">—</span>;
  }

  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums text-text-muted">
        — 0.0
      </span>
    );
  }

  const improved = delta > 0;

  return (
    <motion.span
      initial={{
        opacity: 0,
        backgroundColor: improved
          ? "rgba(34, 197, 94, 0.35)"
          : "rgba(239, 68, 68, 0.35)",
      }}
      animate={{ opacity: 1, backgroundColor: "rgba(0, 0, 0, 0)" }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className={`inline-flex items-center gap-1 rounded px-1 text-sm font-semibold tabular-nums ${
        improved ? "text-accent-green" : "text-accent-red"
      }`}
    >
      {improved ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
    </motion.span>
  );
}
