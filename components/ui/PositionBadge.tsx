"use client";

import { motion } from "framer-motion";

interface PositionBadgeProps {
  position: number | null | undefined;
}

function badgeClasses(position: number): string {
  const base = "text-white shadow-sm ring-1 ring-inset ring-white/15";
  if (position <= 3) {
    return `bg-gradient-to-br from-pos-top3 to-pos-top3/80 text-sm font-bold px-2.5 py-1 ${base}`;
  }
  if (position <= 10) {
    return `bg-gradient-to-br from-pos-top10 to-pos-top10/80 text-xs font-semibold px-2 py-0.5 ${base}`;
  }
  if (position <= 20) {
    return `bg-gradient-to-br from-pos-top20 to-pos-top20/80 text-xs font-semibold px-2 py-0.5 ${base}`;
  }
  if (position <= 50) {
    return `bg-gradient-to-br from-pos-top50 to-pos-top50/80 text-xs font-semibold px-2 py-0.5 ${base}`;
  }
  return `bg-gradient-to-br from-pos-beyond/90 to-pos-beyond/70 text-xs font-semibold px-2 py-0.5 ${base}`;
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
