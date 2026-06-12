"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import OverviewStats from "@/components/project/OverviewStats";
import PositionDistributionChart from "@/components/project/PositionDistributionChart";
import TopKeywords from "@/components/project/TopKeywords";
import ComparisonCard from "@/components/project/ComparisonCard";
import VisibilityChart from "@/components/project/VisibilityChart";
import AnnotationsPanel from "@/components/project/AnnotationsPanel";
import {
  ChartSkeleton,
  StatRowSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { apiGet, errorMessage } from "@/lib/client";
import type { OverviewStats as OverviewStatsData } from "@/lib/types";

export default function OverviewPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [stats, setStats] = useState<OverviewStatsData | null>(null);
  const [domain, setDomain] = useState("");

  const load = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      apiGet<OverviewStatsData>(`/api/projects/${projectId}/overview`),
      apiGet<{ domain: string }>(`/api/projects/${projectId}`),
    ])
      .then(([overview, project]) => {
        setStats(overview);
        setDomain(project.domain);
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    return () => window.removeEventListener("project-synced", load);
  }, [load]);

  if (!stats) {
    return (
      <div className="space-y-6">
        <StatRowSkeleton cards={5} />
        <ChartSkeleton />
      </div>
    );
  }

  if (stats.totalKeywords === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-2xl border border-dashed border-border-base bg-bg-card p-16 text-center"
      >
        <p className="text-2xl">📭</p>
        <h2 className="mt-3 text-lg font-semibold text-text-primary">
          No keyword data yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          Click <strong>Sync Now</strong> to pull the last 30 days of data from
          Google Search Console, or add keywords manually in the All Keywords
          tab.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <OverviewStats stats={stats} domain={domain} />
      <ComparisonCard projectId={Number(projectId)} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <VisibilityChart projectId={Number(projectId)} />
        </div>
        <div className="xl:col-span-2">
          <AnnotationsPanel projectId={Number(projectId)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <PositionDistributionChart distribution={stats.distribution} />
        </div>
        <div className="xl:col-span-2">
          <TopKeywords keywords={stats.topKeywords} />
        </div>
      </div>
    </motion.div>
  );
}
