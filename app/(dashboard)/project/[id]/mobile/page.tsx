"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import MobileComparisonTable from "@/components/project/MobileComparisonTable";
import MobilePhoneMockup from "@/components/project/MobilePhoneMockup";
import StatCard from "@/components/ui/StatCard";
import RangeSelector from "@/components/ui/RangeSelector";
import {
  StatRowSkeleton,
  TableSkeleton,
} from "@/components/ui/LoadingSkeleton";
import { apiGet, errorMessage } from "@/lib/client";
import type { MobileData } from "@/lib/types";

export default function MobilePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [data, setData] = useState<MobileData | null>(null);
  const [location, setLocation] = useState("");
  const [days, setDays] = useState<number>(30);

  const load = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      apiGet<MobileData>(`/api/projects/${projectId}/mobile?days=${days}`),
      apiGet<{ location: string }>(`/api/projects/${projectId}`),
    ])
      .then(([mobile, project]) => {
        setData(mobile);
        setLocation(project.location);
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId, days]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    return () => window.removeEventListener("project-synced", load);
  }, [load]);

  if (!data) {
    return (
      <div className="space-y-6">
        <StatRowSkeleton cards={3} />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Desktop vs Mobile</h2>
        <RangeSelector value={days} onChange={setDays} allowCustom />
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="Avg Mobile Pos"
          value={data.avgMobile}
          decimals={1}
          color="blue"
        />
        <StatCard
          label="Better on Mobile"
          value={data.betterOnMobile}
          subtitle="mobile < desktop"
          color="green"
        />
        <StatCard
          label="Worse on Mobile"
          value={data.worseOnMobile}
          subtitle="mobile > desktop"
          color="red"
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_auto]">
        <MobileComparisonTable rows={data.rows} />
        <MobilePhoneMockup data={data} location={location} />
      </div>
    </motion.div>
  );
}
