"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronDown, Download, FileText, RefreshCw, Share2, Sparkles } from "lucide-react";
import { useCalendar } from "@/contexts/CalendarContext";
import { formatDateShort } from "@/lib/jalaali";
import TabNav from "@/components/layout/TabNav";
import BottomNav from "@/components/layout/BottomNav";
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
  const pathname = usePathname();
  const projectId = params.id;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMenuOpen, setSyncMenuOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);

  useEffect(() => {
    apiGet<{ configured: boolean }>("/api/settings/ai")
      .then((s) => setAiConnected(s.configured))
      .catch(() => setAiConnected(false));
  }, []);

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

  const handleSync = async (days?: number) => {
    setSyncing(true);
    setSyncMenuOpen(false);
    toast(
      days
        ? `Deep sync started — pulling ${days} days from Search Console…`
        : "Sync started — pulling from Search Console…",
      { icon: "🔄" }
    );
    try {
      await apiPost(`/api/projects/${projectId}/sync`, days ? { days } : undefined);
      toast.success("Sync complete");
      window.dispatchEvent(new Event("project-synced"));
    } catch (error) {
      toast.error(`Sync failed: ${errorMessage(error)}`);
    } finally {
      setSyncing(false);
    }
  };

  const DEEP_SYNC_OPTIONS = [30, 90, 180, 365];

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
    { label: "Research", href: `${base}/research` },
    { label: "Pages", href: `${base}/pages` },
    { label: "Insights", href: `${base}/insights` },
    { label: "Analytics", href: `${base}/analytics` },
    { label: "Movers & Drops", href: `${base}/movers` },
    { label: "Competitors", href: `${base}/competitors` },
    { label: "Mobile", href: `${base}/mobile` },
    { label: "Site Health", href: `${base}/health` },
    { label: "Sitemap", href: `${base}/sitemap` },
    { label: "On-Page", href: `${base}/onpage` },
    { label: "AI Audit", href: `${base}/ai` },
    { label: "Alerts", href: `${base}/alerts`, badge: project?.unreadAlerts },
  ];

  // Swipe left/right to move between adjacent tabs (mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    touchStart.current = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > 50) return; // horizontal swipes only
    const idx = tabs.findIndex((tab) => tab.href === pathname);
    if (idx === -1) return;
    const next = dx < 0 ? idx + 1 : idx - 1;
    if (next >= 0 && next < tabs.length) router.push(tabs[next].href);
  };

  return (
    <div>
      {/* Sync progress bar */}
      {syncing ? (
        <div className="progress-indeterminate fixed inset-x-0 top-0 z-50 h-0.5 bg-accent-blue/20" />
      ) : null}

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
          {aiConnected ? (
            <button
              type="button"
              onClick={() => router.push(`/project/${projectId}/ai?run=1`)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-blue to-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Sparkles size={13} />
              AI Audit
            </button>
          ) : null}
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
          <a
            href={`/api/projects/${projectId}/export?format=file`}
            className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <Download size={13} />
            JSON
          </a>
          <a
            href={`/report/${projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <FileText size={13} />
            Report
          </a>
          <div className="relative flex">
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-l-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
            <button
              type="button"
              aria-label="Deep sync options"
              onClick={() => setSyncMenuOpen((v) => !v)}
              disabled={syncing}
              className="flex items-center rounded-r-lg border-l border-white/20 bg-accent-blue px-1.5 py-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <ChevronDown size={13} />
            </button>
            {syncMenuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSyncMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border-base bg-bg-card shadow-card-hover">
                  <p className="border-b border-border-base px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Deep sync — pull last
                  </p>
                  {DEEP_SYNC_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => void handleSync(d)}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                    >
                      {d} days{d >= 365 ? " (≈1 year)" : d >= 180 ? " (≈6 months)" : ""}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>

      <div className="mt-4">
        <TabNav tabs={tabs} />
      </div>

      <div className="mt-6" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {children}
      </div>

      {projectId ? <BottomNav projectId={projectId} /> : null}

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
