"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { MapPin, RefreshCw, Trash2 } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
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

  return (
    <motion.div
      variants={projectCardVariants}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      onClick={() => router.push(`/project/${project.id}`)}
      className="cursor-pointer rounded-2xl border border-border-base bg-bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-bold text-text-primary">
            {project.domain}
          </h3>
          <p className="truncate text-sm text-text-secondary">{project.name}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
          <MapPin size={12} />
          {project.location}
        </span>
      </div>

      <div className="mt-5 flex gap-8">
        <div>
          <p className="text-2xl font-bold tabular-nums text-text-primary">
            <AnimatedNumber value={project.keywordCount} />
          </p>
          <p className="text-xs text-text-muted">keywords</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-accent-blue">
            {project.avgPosition === null ? (
              "–"
            ) : (
              <AnimatedNumber value={project.avgPosition} decimals={1} />
            )}
          </p>
          <p className="text-xs text-text-muted">avg position</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
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
