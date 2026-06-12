"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CheckCheck } from "lucide-react";
import AlertsList from "@/components/project/AlertsList";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, apiPut, errorMessage } from "@/lib/client";
import type { AlertRow } from "@/lib/types";

type AlertFilter = "all" | "jumped" | "dropped" | "unread";

export default function AlertsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);
  const [filter, setFilter] = useState<AlertFilter>("all");

  const load = useCallback(() => {
    if (!projectId) return;
    const query = filter === "all" ? "" : `?filter=${filter}`;
    apiGet<AlertRow[]>(`/api/projects/${projectId}/alerts${query}`)
      .then(setAlerts)
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId, filter]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    return () => window.removeEventListener("project-synced", load);
  }, [load]);

  const onChanged = () => {
    load();
    window.dispatchEvent(new Event("alerts-changed"));
  };

  const markAllRead = async () => {
    try {
      const result = await apiPut<{ updated: number }>(
        `/api/projects/${projectId}/alerts`
      );
      toast.success(`${result.updated} alert${result.updated === 1 ? "" : "s"} marked as read`);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as AlertFilter)}
          className="rounded-lg border border-border-base bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
        >
          <option value="all">All Alerts</option>
          <option value="jumped">Jumped</option>
          <option value="dropped">Dropped</option>
          <option value="unread">Unread</option>
        </select>
        <button
          type="button"
          onClick={() => void markAllRead()}
          className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          <CheckCheck size={14} />
          Mark all as read
        </button>
      </div>

      {alerts === null ? (
        <ListSkeleton rows={5} />
      ) : (
        <AlertsList alerts={alerts} onChanged={onChanged} />
      )}
    </motion.div>
  );
}
