"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import {
  Bell,
  MapPin,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trash2,
} from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import SiteAvatar from "@/components/ui/SiteAvatar";
import MiniDistribution from "@/components/dashboard/MiniDistribution";
import { apiDelete, apiPost, errorMessage } from "@/lib/client";
import type { ProjectSummary } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectSummary;
  onChanged: () => void;
}

export const projectCardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export default function ProjectCard({ project, onChanged }: ProjectCardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setSyncing(true);
    toast(`Sync started for ${project.domain}…`, { icon: "🔄" });
    try {
      await apiPost(`/api/projects/${project.id}/sync`);
      toast.success(`Sync complete for ${project.domain}`);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm(`Delete project "${project.name}" and all its data?`)) {
      return;
    }
    try {
      await apiDelete(`/api/projects/${project.id}`);
      toast.success(`Project "${project.name}" deleted`);
      onChanged();
      window.dispatchEvent(new Event("projects-changed"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const hasData = project.keywordCount > 0;

  return (
    <motion.div
      variants={projectCardVariants}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      onClick={() => router.push(`/project/${project.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border-base bg-bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* Colored top accent (project color, else avatar gradient blue) */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: project.color ?? "var(--accent-blue)" }}
      />
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SiteAvatar domain={project.domain} size={42} color={project.color} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-text-primary">
              {project.domain}
            </h3>
            <p className="truncate text-sm text-text-secondary">{project.name}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
            <MapPin size={12} />
            {project.location}
          </span>
          {project.unreadAlerts > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-accent-red/10 px-2 py-0.5 text-xs font-semibold text-accent-red">
              <Bell size={11} className="fill-current" />
              {project.unreadAlerts} alert{project.unreadAlerts === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-bg-secondary/60 px-3 py-2.5">
          <p className="text-xl font-bold tabular-nums text-text-primary">
            <AnimatedNumber value={project.keywordCount} />
          </p>
          <p className="text-[11px] text-text-muted">keywords</p>
        </div>
        <div className="rounded-xl bg-bg-secondary/60 px-3 py-2.5">
          <p className="text-xl font-bold tabular-nums text-accent-blue">
            {project.avgPosition === null ? (
              "–"
            ) : (
              <AnimatedNumber value={project.avgPosition} decimals={1} />
            )}
          </p>
          <p className="text-[11px] text-text-muted">avg position</p>
        </div>
        <div className="rounded-xl bg-bg-secondary/60 px-3 py-2.5">
          <p className="text-xl font-bold tabular-nums text-accent-green">
            <AnimatedNumber value={project.top10} />
          </p>
          <p className="text-[11px] text-text-muted">in top 10</p>
        </div>
      </div>

      {/* Distribution bar + movement */}
      {hasData ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-text-muted">
            <span>Position spread</span>
            <span className="flex items-center gap-2.5">
              {project.improved > 0 ? (
                <span className="flex items-center gap-0.5 font-semibold text-accent-green">
                  <TrendingUp size={12} />
                  {project.improved}
                </span>
              ) : null}
              {project.dropped > 0 ? (
                <span className="flex items-center gap-0.5 font-semibold text-accent-red">
                  <TrendingDown size={12} />
                  {project.dropped}
                </span>
              ) : null}
            </span>
          </div>
          <MiniDistribution distribution={project.distribution} />
        </div>
      ) : null}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border-base pt-3">
        <p className="text-xs text-text-muted">
          {project.lastSyncAt
            ? `Synced ${formatDistanceToNow(new Date(project.lastSyncAt), { addSuffix: true })}`
            : "Never synced"}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Sync now"
            onClick={(e) => void handleSync(e)}
            disabled={syncing}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:text-accent-blue disabled:opacity-50"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            aria-label="Delete project"
            onClick={(e) => void handleDelete(e)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:text-accent-red"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
