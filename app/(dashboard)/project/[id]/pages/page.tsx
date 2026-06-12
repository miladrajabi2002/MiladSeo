"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import PagesTable from "@/components/project/PagesTable";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, errorMessage } from "@/lib/client";
import type { PageRow } from "@/lib/types";

export default function PagesPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [rows, setRows] = useState<PageRow[] | null>(null);

  const load = useCallback(() => {
    if (!projectId) return;
    apiGet<PageRow[]>(`/api/projects/${projectId}/pages`)
      .then(setRows)
      .catch((error) => {
        toast.error(errorMessage(error));
        setRows([]);
      });
  }, [projectId]);

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
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary">
          Pages{rows ? ` (${rows.length})` : ""}
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">
          Per-URL performance — click a row to see the keywords each page
          ranks for
        </p>
      </div>

      {rows === null ? <TableSkeleton rows={10} /> : <PagesTable rows={rows} />}
    </motion.div>
  );
}
