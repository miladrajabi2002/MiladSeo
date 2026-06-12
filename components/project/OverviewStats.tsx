"use client";

import { motion } from "framer-motion";
import StatCard from "@/components/ui/StatCard";
import type { OverviewStats as OverviewStatsData } from "@/lib/types";

interface OverviewStatsProps {
  stats: OverviewStatsData;
  domain: string;
}

export default function OverviewStats({ stats, domain }: OverviewStatsProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
    >
      <StatCard
        label="Top 10"
        value={stats.top10}
        subtitle="position ≤ 10"
        color="green"
      />
      <StatCard
        label="Top 20"
        value={stats.top20}
        subtitle="positions 11–20"
        color="blue"
      />
      <StatCard
        label="Top 50"
        value={stats.top50}
        subtitle="positions 21–50"
        color="yellow"
      />
      <StatCard
        label="Avg Desktop Pos"
        value={stats.avgDesktop}
        decimals={1}
        subtitle={`all ${stats.totalKeywords} keywords`}
      />
      <StatCard
        label="Total Keywords"
        value={stats.totalKeywords}
        subtitle={domain}
      />
    </motion.div>
  );
}
