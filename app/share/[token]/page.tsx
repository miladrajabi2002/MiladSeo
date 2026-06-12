"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, ShieldOff } from "lucide-react";
import SiteAvatar from "@/components/ui/SiteAvatar";
import StatCard from "@/components/ui/StatCard";
import PositionBadge from "@/components/ui/PositionBadge";
import DeltaBadge from "@/components/ui/DeltaBadge";
import PositionDistributionChart from "@/components/project/PositionDistributionChart";
import TrafficChart from "@/components/project/TrafficChart";
import { apiGet } from "@/lib/client";
import type { MoverRow, PublicDashboard } from "@/lib/types";

function MoversList({
  title,
  rows,
  improved,
}: {
  title: string;
  rows: MoverRow[];
  improved: boolean;
}) {
  return (
    <div className="rounded-xl border border-border-base bg-bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        {improved ? (
          <ArrowUp size={15} className="text-accent-green" />
        ) : (
          <ArrowDown size={15} className="text-accent-red" />
        )}
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-text-muted">
            Nothing this week
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-lg border border-border-base px-3 py-2"
            >
              <PositionBadge position={row.nowPos} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                {row.text}
              </span>
              <DeltaBadge delta={row.delta} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PublicSharePage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<PublicDashboard | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!params.token) return;
    apiGet<PublicDashboard>(`/api/share/${params.token}`)
      .then(setData)
      .catch(() => setFailed(true));
  }, [params.token]);

  if (failed) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-border-base bg-bg-card p-10 text-center shadow-card">
          <ShieldOff size={32} className="mx-auto text-text-muted" />
          <h1 className="mt-4 text-lg font-bold text-text-primary">
            Link not available
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            This share link has been revoked or never existed. Ask the report
            owner for a new one.
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="h-16 animate-pulse rounded-2xl bg-bg-card" />
        <div className="h-32 animate-pulse rounded-2xl bg-bg-card" />
        <div className="h-72 animate-pulse rounded-2xl bg-bg-card" />
      </main>
    );
  }

  const { overview } = data;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-base bg-bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <SiteAvatar domain={data.domain} size={44} />
            <div>
              <h1 className="text-lg font-bold text-text-primary">
                {data.projectName}
              </h1>
              <p className="text-xs text-text-secondary">
                {data.domain} · SEO performance report
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Read-only report
            </p>
            <p className="text-xs text-text-secondary">
              Updated{" "}
              {data.lastSyncAt
                ? format(parseISO(data.lastSyncAt), "MMM d, yyyy")
                : "–"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
        >
          <StatCard label="Top 10" value={overview.top10} color="green" />
          <StatCard label="Top 20" value={overview.top20} color="blue" />
          <StatCard label="Top 50" value={overview.top50} color="yellow" />
          <StatCard
            label="Avg Position"
            value={overview.avgDesktop}
            decimals={1}
          />
          <StatCard
            label="Visibility"
            value={data.visibility.current}
            decimals={1}
            subtitle="share of voice %"
            color="blue"
          />
        </motion.div>

        {/* Traffic */}
        <TrafficChart
          series={data.traffic}
          totalClicks={data.traffic.reduce((a, p) => a + p.clicks, 0)}
          totalImpressions={data.traffic.reduce((a, p) => a + p.impressions, 0)}
          avgCtr={null}
        />

        {/* Distribution */}
        <PositionDistributionChart distribution={overview.distribution} />

        {/* Movers */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MoversList
            title="Top Improvements"
            rows={data.movers.improved}
            improved
          />
          <MoversList
            title="Biggest Drops"
            rows={data.movers.dropped}
            improved={false}
          />
        </div>

        <p className="pb-4 text-center text-xs text-text-muted">
          Generated by {process.env.NEXT_PUBLIC_APP_NAME ?? "SEO Dashboard"} —
          data from Google Search Console
        </p>
      </motion.div>
    </main>
  );
}
