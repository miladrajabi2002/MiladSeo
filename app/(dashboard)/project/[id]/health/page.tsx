"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import IndexStatusView from "@/components/project/IndexStatusView";
import PageSpeedView from "@/components/project/PageSpeedView";
import CruxView from "@/components/project/CruxView";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, errorMessage } from "@/lib/client";
import type { IndexStatusRow, PageSpeedRow } from "@/lib/types";

export default function HealthPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [indexRows, setIndexRows] = useState<IndexStatusRow[] | null>(null);
  const [speedRows, setSpeedRows] = useState<PageSpeedRow[] | null>(null);

  const load = useCallback(() => {
    if (!projectId) return;
    apiGet<IndexStatusRow[]>(`/api/projects/${projectId}/index-status`)
      .then(setIndexRows)
      .catch((error) => toast.error(errorMessage(error)));
    apiGet<PageSpeedRow[]>(`/api/projects/${projectId}/pagespeed`)
      .then(setSpeedRows)
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    return () => window.removeEventListener("project-synced", load);
  }, [load]);

  const urlPaths = indexRows?.map((r) => r.urlPath) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {indexRows === null ? (
        <TableSkeleton rows={6} />
      ) : (
        <IndexStatusView
          projectId={projectId}
          rows={indexRows}
          onChanged={load}
        />
      )}

      {indexRows === null || speedRows === null ? (
        <TableSkeleton rows={6} />
      ) : (
        <PageSpeedView
          projectId={projectId}
          urlPaths={urlPaths}
          results={speedRows}
          onChanged={load}
        />
      )}

      <CruxView projectId={projectId} />
    </motion.div>
  );
}
