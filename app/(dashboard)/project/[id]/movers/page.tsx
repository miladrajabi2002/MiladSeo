"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import MoversDropsView from "@/components/project/MoversDropsView";
import RangeSelector from "@/components/ui/RangeSelector";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, errorMessage } from "@/lib/client";
import type { MoversData } from "@/lib/types";

export default function MoversPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [movers, setMovers] = useState<MoversData | null>(null);
  const [days, setDays] = useState<number>(30);

  const load = useCallback(() => {
    if (!projectId) return;
    apiGet<MoversData>(`/api/projects/${projectId}/movers?days=${days}`)
      .then(setMovers)
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId, days]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    return () => window.removeEventListener("project-synced", load);
  }, [load]);

  if (!movers) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TableSkeleton rows={6} />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (movers.improved.length === 0 && movers.dropped.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-2xl border border-dashed border-border-base bg-bg-card p-16 text-center"
      >
        <p className="text-2xl">📊</p>
        <h2 className="mt-3 text-lg font-semibold text-text-primary">
          No movement detected yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          Movers and drops compare current positions with 7 days ago. Once you
          have at least a week of synced data, changes will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Movers &amp; Drops</h2>
        <RangeSelector value={days} onChange={setDays} allowCustom />
      </div>
      <MoversDropsView movers={movers} />
    </motion.div>
  );
}
