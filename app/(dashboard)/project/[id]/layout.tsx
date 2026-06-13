"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Download, RefreshCw, Share2 } from "lucide-react";
import { useCalendar } from "@/contexts/CalendarContext";
import { formatDateShort } from "@/lib/jalaali";
import TabNav from "@/components/layout/TabNav";
import SiteAvatar from "@/components/ui/SiteAvatar";
import ShareModal from "@/components/project/ShareModal";
import { apiGet, apiPost, errorMessage } from "@/lib/client";

interface ProjectDetail {
  id: number;
  name: string;
  domain: string;
  gscProperty: string;
  location: string;
  lastSyncAt: string | null;
  keywordCount: number;
  unreadAlerts: number;
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(() => {
    if (!projectId) return;
    apiGet<ProjectDetail>(`/api/projects/${projectId}`)
      .then(setProject)
      .catch(() => {
        toast.error("Project not found");
        router.push("/");
      });
  }, [projectId, router]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    window.addEventListener("alerts-changed", load);
    return () => {
      window.removeEventListener("project-synced", load);
      window.removeEventListener("alerts-changed", load);
    };
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    toast("Sync started — pulling 30 days from Search Console…", { icon: "🔄" });
    try {
      await apiPost(`/api/projects/${projectId}/sync`);
      toast.success("Sync complete");
      window.dispatchEvent(new Event("project-synced"));
    } catch (error) {
      toast.error(`Sync failed: ${errorMessage(error)}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleLiveSheet = async () => {
    setSheetLoading(true);
    try {
      const result = await apiPost<{ url: string }>(
        `/api/projects/${projectId}/live-sheet`
      );
      toast.success("Live Sheet updated");
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSheetLoading(false);
    }
  };

  const { calendar } = useCalendar();
  const base = `/project/${projectId}`;
  const tabs = [
    { label: "Overview", href: base },
    { label: "All Keywords", href: `${base}/keywords` },
    { label: "Pages", href: `${base}/pages` },
    { label: "Insights", href: `${base}/insights` },
    { label: "Movers & Drops", href: `${base}/movers` },
    { label: "Mobile", href: `${base}/mobile` },
    { label: "Site Health", href: `${base}/health` },
    { label: "AI Audit", href: `${base}/ai` },
    { label: "Alerts", href: `${base}/alerts`, badge: project?.unreadAlerts },
  ];

  return (
    <div>
      {/* Header bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          {project ? (
            <SiteAvatar domain={project.domain} size={44} />
          ) : (
            <span className="h-11 w-11 animate-pulse rounded-xl bg-bg-secondary" />
          )}
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              {project?.domain ?? "Loading…"}
            </h1>
            <p className="text-xs text-text-secondary">
              {project
                ? `${project.location} · ${project.keywordCount} keywords · desktop + mobile`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">
            Last update:{" "}
            {project?.lastSyncAt
              ? formatDateShort(project.lastSyncAt.substring(0, 10), calendar)
              : "never"}
          </span>
          <button
            type="button"
            onClick={() => void handleLiveSheet()}
            disabled={sheetLoading}
            className="flex items-center gap-2 rounded-lg border-2 border-accent-green bg-transparent px-3 py-1 text-xs font-semibold text-accent-green transition-colors hover:bg-[rgba(34,197,94,0.1)] disabled:opacity-50"
          >
            <span className="blink-dot h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" />
            {sheetLoading ? "Updating…" : "Live Sheet"}
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <Share2 size={13} />
            Share
          </button>
          <a
            href={`/api/projects/${projectId}/keywords?format=csv`}
            className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <Download size={13} />
            CSV
          </a>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </motion.div>

      <div className="mt-4">
        <TabNav tabs={tabs} />
      </div>

      <div className="mt-6">{children}</div>

      {projectId ? (
        <ShareModal
          projectId={Number(projectId)}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}
