"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import TrafficChart from "@/components/project/TrafficChart";
import OpportunitiesTable from "@/components/project/OpportunitiesTable";
import CannibalizationView from "@/components/project/CannibalizationView";
import SerpFeaturesView from "@/components/project/SerpFeaturesView";
import AiSnippets from "@/components/project/AiSnippets";
import AiAssist from "@/components/project/AiAssist";
import RangeSelector from "@/components/ui/RangeSelector";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, errorMessage } from "@/lib/client";
import type { CannibalizationGroup, TrafficData } from "@/lib/types";

export default function InsightsPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [days, setDays] = useState<number>(30);
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [cannibalization, setCannibalization] = useState<
    CannibalizationGroup[] | null
  >(null);

  const load = useCallback(() => {
    if (!projectId) return;
    apiGet<TrafficData>(`/api/projects/${projectId}/traffic?days=${days}`)
      .then(setTraffic)
      .catch((error) => toast.error(errorMessage(error)));
    apiGet<CannibalizationGroup[]>(
      `/api/projects/${projectId}/cannibalization`
    )
      .then(setCannibalization)
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId, days]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    return () => window.removeEventListener("project-synced", load);
  }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">
          Traffic & Optimization Insights
        </h2>
        <RangeSelector value={days} onChange={setDays} allowCustom />
      </div>

      {traffic === null ? (
        <ChartSkeleton />
      ) : (
        <TrafficChart
          series={traffic.series}
          totalClicks={traffic.totalClicks}
          totalImpressions={traffic.totalImpressions}
          avgCtr={traffic.avgCtr}
        />
      )}

      {traffic === null ? (
        <TableSkeleton rows={5} />
      ) : (
        <OpportunitiesTable rows={traffic.opportunities} />
      )}

      <AiSnippets projectId={projectId} />

      <SerpFeaturesView projectId={projectId} days={days} />

      {cannibalization === null ? (
        <TableSkeleton rows={4} />
      ) : (
        <CannibalizationView groups={cannibalization} />
      )}

      <AiAssist projectId={projectId} area="insights" />
    </motion.div>
  );
}
