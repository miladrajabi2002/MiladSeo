"use client";

import { motion } from "framer-motion";

interface PositionBadgeProps {
  position: number | null | undefined;
}

function badgeClasses(position: number): string {
  if (position <= 3) {
    return "bg-pos-top3 text-white text-sm font-bold px-2.5 py-1";
  }
  if (position <= 10) {
    return "bg-pos-top10 text-white text-xs font-semibold px-2 py-0.5";
  }
  if (position <= 20) {
    return "bg-pos-top20 text-white text-xs font-semibold px-2 py-0.5";
  }
  if (position <= 50) {
    return "bg-pos-top50 text-white text-xs font-semibold px-2 py-0.5";
  }
  return "bg-pos-beyond/80 text-white text-xs font-semibold px-2 py-0.5";
}

export default function PositionBadge({ position }: PositionBadgeProps) {
  if (position === null || position === undefined) {
    return <span className="text-sm text-text-muted">–</span>;
  }

  return (
    <motion.span
      key={position}
      initial={{ scale: 1.3 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-md tabular-nums ${badgeClasses(position)}`}
    >
      {position.toFixed(1)}
    </motion.span>
  );
}
