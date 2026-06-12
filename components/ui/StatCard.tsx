"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

interface StatCardProps {
  label: string;
  value: number | null;
  decimals?: number;
  subtitle?: string;
  color?: "green" | "blue" | "yellow" | "red" | "default";
}

const COLOR_CLASSES: Record<NonNullable<StatCardProps["color"]>, string> = {
  green: "text-accent-green",
  blue: "text-accent-blue",
  yellow: "text-accent-yellow",
  red: "text-accent-red",
  default: "text-text-primary",
};

export const statCardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export default function StatCard({
  label,
  value,
  decimals = 0,
  subtitle,
  color = "default",
}: StatCardProps) {
  return (
    <motion.div
      variants={statCardVariants}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-border-base bg-bg-card p-4 shadow-card"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${COLOR_CLASSES[color]}`}>
        {value === null ? (
          <span className="text-text-muted">–</span>
        ) : (
          <AnimatedNumber value={value} decimals={decimals} />
        )}
      </p>
      {subtitle ? (
        <p className="mt-1 truncate text-xs text-text-secondary">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}
