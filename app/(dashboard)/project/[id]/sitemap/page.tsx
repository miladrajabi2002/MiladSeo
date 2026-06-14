"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Check,
  ExternalLink,
  Loader2,
  Map as MapIcon,
  RefreshCw,
} from "lucide-react";
import { apiGet, errorMessage } from "@/lib/client";
import type { SitemapReport } from "@/lib/types";

type Filter = "all" | "tracked" | "untracked";

export default function SitemapPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [report, setReport] = useState<SitemapReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    apiGet<SitemapReport>(`/api/projects/${projectId}/sitemap`)
      .then(setReport)
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const entries = (report?.entries ?? []).filter((e) =>
    filter === "tracked" ? e.tracked : filter === "untracked" ? !e.tracked : true
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapIcon size={18} className="text-accent-blue" />
          <h2 className="text-base font-semibold text-text-primary">Sitemap Explorer</h2>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {loading ? "Parsing…" : "Re-parse"}
        </button>
      </div>

      {report === null ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-base bg-bg-card text-sm text-text-muted">
          <Loader2 size={16} className="mr-2 animate-spin" /> Reading sitemap…
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border-base bg-bg-card p-4 shadow-card">
              <p className="text-xl font-bold tabular-nums text-text-primary">{report.totalUrls}</p>
              <p className="text-[11px] text-text-muted">URLs in sitemap</p>
            </div>
            <div className="rounded-xl border border-border-base bg-bg-card p-4 shadow-card">
              <p className="text-xl font-bold tabular-nums text-accent-green">{report.trackedCount}</p>
              <p className="text-[11px] text-text-muted">Tracked pages</p>
            </div>
            <div className="rounded-xl border border-border-base bg-bg-card p-4 shadow-card">
              <p className="text-xl font-bold tabular-nums text-accent-yellow">{report.untrackedCount}</p>
              <p className="text-[11px] text-text-muted">Not tracked</p>
            </div>
            <div className="rounded-xl border border-border-base bg-bg-card p-4 shadow-card">
              <p className="text-xl font-bold tabular-nums text-text-primary">{report.sitemaps.length}</p>
              <p className="text-[11px] text-text-muted">Sitemap files</p>
            </div>
          </div>

          {report.errors.length > 0 ? (
            <p className="rounded-lg bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
              Could not read {report.errors.length} sitemap file(s): {report.errors.join(", ")}
            </p>
          ) : null}

          {report.totalUrls === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-base bg-bg-card p-12 text-center">
              <p className="text-2xl">🗺️</p>
              <h3 className="mt-3 text-lg font-semibold text-text-primary">No sitemap found</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
                We looked in robots.txt and at /sitemap.xml but found no URLs. Make sure the site
                publishes a sitemap.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border-base bg-bg-card shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-base p-4">
                <div className="flex rounded-lg border border-border-base p-0.5">
                  {(["all", "tracked", "untracked"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                        filter === f
                          ? "bg-accent-blue text-white"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-text-muted">{entries.length} shown</span>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-bg-card">
                    <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
                      <th className="px-4 py-2.5">URL</th>
                      <th className="px-4 py-2.5">Last modified</th>
                      <th className="px-4 py-2.5">Tracked</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr
                        key={e.loc}
                        className="border-b border-border-base transition-colors last:border-0 hover:bg-bg-secondary"
                      >
                        <td className="max-w-[420px] px-4 py-2.5">
                          <span className="block truncate font-mono text-xs text-text-primary">
                            {e.path}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-text-secondary">
                          {e.lastmod ?? "–"}
                        </td>
                        <td className="px-4 py-2.5">
                          {e.tracked ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-green">
                              <Check size={10} /> tracked
                            </span>
                          ) : (
                            <span className="rounded-full bg-bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <a
                            href={e.loc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs text-accent-blue hover:opacity-80"
                          >
                            Open <ExternalLink size={10} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
