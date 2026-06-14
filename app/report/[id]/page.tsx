"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { apiGet, errorMessage } from "@/lib/client";
import type {
  KeywordRow,
  MoversData,
  OverviewStats,
  PageRow,
  TrafficData,
  VisibilityData,
} from "@/lib/types";

interface FullExport {
  exportedAt: string;
  project: { name: string; domain: string; location: string; lastSyncAt: string | null };
  overview: OverviewStats;
  keywords: KeywordRow[];
  movers: MoversData;
  traffic: TrafficData;
  visibility: VisibilityData;
  pages: PageRow[];
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xl font-bold tabular-nums text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [data, setData] = useState<FullExport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<FullExport>(`/api/projects/${projectId}/export`)
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [projectId]);

  if (error) {
    return <div className="p-10 text-center text-red-600">{error}</div>;
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" /> Building report…
      </div>
    );
  }

  const o = data.overview;
  const t = data.traffic;

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-gray-900">
      {/* Print toolbar — hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm text-gray-500">
          Generated {new Date(data.exportedAt).toLocaleString()}
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>

      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold">{data.project.name}</h1>
        <p className="text-sm text-gray-500">
          {data.project.domain} · {data.project.location} · SEO Performance Report
        </p>
      </header>

      {/* Overview */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Overview</h2>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Total keywords" value={o.totalKeywords} />
          <Stat label="Avg position" value={o.avgDesktop ?? "–"} />
          <Stat label="Top 10" value={o.top10} />
          <Stat label="Visibility" value={data.visibility.current ?? "–"} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Clicks (90d)" value={t.totalClicks.toLocaleString()} />
          <Stat label="Impressions (90d)" value={t.totalImpressions.toLocaleString()} />
          <Stat label="Avg CTR" value={t.avgCtr !== null ? `${t.avgCtr}%` : "–"} />
        </div>
      </section>

      {/* Top keywords */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Top keywords</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
              <th className="py-1.5">Keyword</th>
              <th className="py-1.5">Desktop</th>
              <th className="py-1.5">Mobile</th>
              <th className="py-1.5">Clicks</th>
              <th className="py-1.5">Impr.</th>
            </tr>
          </thead>
          <tbody>
            {data.keywords
              .filter((k) => k.desktopPos !== null)
              .sort((a, b) => (a.desktopPos ?? 999) - (b.desktopPos ?? 999))
              .slice(0, 25)
              .map((k) => (
                <tr key={k.id} className="border-b border-gray-100">
                  <td className="py-1.5">{k.text}</td>
                  <td className="py-1.5 tabular-nums">{k.desktopPos ?? "–"}</td>
                  <td className="py-1.5 tabular-nums">{k.mobilePos ?? "–"}</td>
                  <td className="py-1.5 tabular-nums">{k.clicks}</td>
                  <td className="py-1.5 tabular-nums">{k.impressions}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* Movers */}
      <section className="mt-8 break-inside-avoid">
        <h2 className="mb-3 text-lg font-semibold">Biggest movers</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-green-700">Improved</h3>
            <ul className="space-y-1 text-sm">
              {data.movers.improved.slice(0, 8).map((m) => (
                <li key={m.id} className="flex justify-between">
                  <span className="truncate pr-2">{m.text}</span>
                  <span className="tabular-nums text-green-700">▲ {m.delta}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-red-700">Dropped</h3>
            <ul className="space-y-1 text-sm">
              {data.movers.dropped.slice(0, 8).map((m) => (
                <li key={m.id} className="flex justify-between">
                  <span className="truncate pr-2">{m.text}</span>
                  <span className="tabular-nums text-red-700">▼ {Math.abs(m.delta)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Top pages */}
      <section className="mt-8 break-inside-avoid">
        <h2 className="mb-3 text-lg font-semibold">Top pages</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
              <th className="py-1.5">Page</th>
              <th className="py-1.5">Keywords</th>
              <th className="py-1.5">Best pos</th>
              <th className="py-1.5">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {data.pages.slice(0, 15).map((p) => (
              <tr key={p.urlPath} className="border-b border-gray-100">
                <td className="max-w-[280px] truncate py-1.5 font-mono text-xs">{p.urlPath}</td>
                <td className="py-1.5 tabular-nums">{p.keywordCount}</td>
                <td className="py-1.5 tabular-nums">{p.bestPosition ?? "–"}</td>
                <td className="py-1.5 tabular-nums">{p.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
        Generated by SEO Dashboard · {data.project.domain}
      </footer>
    </div>
  );
}
