"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "lucide-react";
import { apiGet } from "@/lib/client";
import type { SerpAppearanceRow } from "@/lib/types";

/** SERP appearance breakdown (rich snippets, FAQ, video…) from Search Console. */
export default function SerpFeaturesView({
  projectId,
  days = 30,
}: {
  projectId: number;
  days?: number;
}) {
  const [rows, setRows] = useState<SerpAppearanceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    apiGet<SerpAppearanceRow[]>(`/api/projects/${projectId}/serp-features?days=${days}`)
      .then((d) => {
        if (!cancelled) setRows(d);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load SERP features (Google account connected?).");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, days]);

  return (
    <div className="rounded-xl border border-border-base bg-bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Sparkle size={15} className="text-accent-yellow" />
        <h3 className="text-sm font-semibold text-text-primary">SERP features</h3>
        <span className="text-xs text-text-muted">— how your results appear on Google</span>
      </div>

      {error ? (
        <p className="text-sm text-text-muted">{error}</p>
      ) : rows === null ? (
        <div className="h-24 animate-pulse rounded-lg bg-bg-secondary" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-muted">
          No special SERP appearances recorded for this period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-4">Appearance</th>
                <th className="py-2 pr-4">Clicks</th>
                <th className="py-2 pr-4">Impressions</th>
                <th className="py-2 pr-4">CTR</th>
                <th className="py-2">Avg pos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.appearance} className="border-b border-border-base last:border-0">
                  <td className="py-2 pr-4 text-sm capitalize text-text-primary">{r.appearance}</td>
                  <td className="py-2 pr-4 text-sm tabular-nums text-accent-blue">
                    {r.clicks.toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-sm tabular-nums text-text-secondary">
                    {r.impressions.toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-sm tabular-nums text-text-secondary">
                    {r.ctr !== null ? `${r.ctr}%` : "–"}
                  </td>
                  <td className="py-2 text-sm tabular-nums text-text-secondary">
                    {r.position ?? "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
