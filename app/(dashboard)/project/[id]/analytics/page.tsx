"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { BarChart3, Loader2, Plug } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { apiGet, apiPatch, errorMessage } from "@/lib/client";
import type { Ga4Property, Ga4Summary } from "@/lib/types";

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-border-base bg-bg-card p-4 shadow-card">
      <p className="text-xl font-bold tabular-nums text-text-primary">
        <AnimatedNumber value={value} />
        {suffix}
      </p>
      <p className="text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [linked, setLinked] = useState<string | null | undefined>(undefined);
  const [summary, setSummary] = useState<Ga4Summary | null>(null);
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [error, setError] = useState<string | null>(null);

  const [properties, setProperties] = useState<Ga4Property[] | null>(null);
  const [picked, setPicked] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProject = useCallback(() => {
    apiGet<{ ga4PropertyId: string | null }>(`/api/projects/${projectId}`)
      .then((p) => setLinked(p.ga4PropertyId))
      .catch((e) => toast.error(errorMessage(e)));
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Load data when linked, or load the picker list when not
  useEffect(() => {
    if (linked) {
      setSummary(null);
      setError(null);
      apiGet<Ga4Summary>(`/api/projects/${projectId}/ga4?days=${days}`)
        .then(setSummary)
        .catch((e) => setError(errorMessage(e)));
    } else if (linked === null && properties === null) {
      apiGet<Ga4Property[]>("/api/ga4/properties")
        .then(setProperties)
        .catch((e) => {
          setProperties([]);
          setError(errorMessage(e));
        });
    }
  }, [linked, days, projectId, properties]);

  const link = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      await apiPatch(`/api/projects/${projectId}`, { ga4PropertyId: picked });
      toast.success("GA4 property linked");
      setLinked(picked);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const unlink = async () => {
    try {
      await apiPatch(`/api/projects/${projectId}`, { ga4PropertyId: "" });
      setLinked(null);
      setSummary(null);
      setProperties(null);
      toast.success("GA4 property unlinked");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (linked === undefined) {
    return <div className="h-40 animate-pulse rounded-2xl bg-bg-secondary" />;
  }

  // ---- Not linked: show picker ----
  if (!linked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-base bg-bg-card p-6"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-accent-blue" />
          <h2 className="text-sm font-bold text-text-primary">Link Google Analytics 4</h2>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          See real visitor behaviour next to your rankings — sessions, users, conversions and
          channels. Uses the same connected Google account (free).
        </p>

        {properties === null ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={15} className="animate-spin" /> Loading your GA4 properties…
          </div>
        ) : properties.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">
            {error ??
              "No GA4 properties found. If you just added the Analytics permission, click Connect Google again in the header to re-authorize."}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
              className="min-w-[260px] flex-1 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
            >
              <option value="">— pick a property —</option>
              {properties.map((p) => (
                <option key={p.property} value={p.property}>
                  {p.displayName} {p.account ? `· ${p.account}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void link()}
              disabled={saving || !picked}
              className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />}
              Link
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // ---- Linked: show summary ----
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-border-base p-0.5">
          {([7, 28, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                days === d ? "bg-accent-blue text-white" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void unlink()}
          className="text-xs text-text-muted transition-colors hover:text-accent-red"
        >
          Unlink property
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-border-base bg-bg-card p-4 text-sm text-text-muted">{error}</p>
      ) : summary === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-bg-secondary" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Sessions" value={summary.totals.sessions} />
            <StatCard label="Users" value={summary.totals.users} />
            <StatCard label="New users" value={summary.totals.newUsers} />
            <StatCard label="Conversions" value={summary.totals.conversions} />
            <div className="rounded-xl border border-border-base bg-bg-card p-4 shadow-card">
              <p className="text-xl font-bold tabular-nums text-text-primary">
                {duration(summary.totals.avgSessionDuration)}
              </p>
              <p className="text-[11px] text-text-muted">Avg. session</p>
            </div>
            <StatCard label="Bounce rate" value={summary.totals.bounceRate} suffix="%" />
          </div>

          {/* Sessions / users trend */}
          <div className="rounded-2xl border border-border-base bg-bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-bold text-text-primary">Sessions & users</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.series} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="ga-sessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} minTickGap={28} />
                  <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="var(--accent-blue)" strokeWidth={2} fill="url(#ga-sessions)" />
                  <Area type="monotone" dataKey="users" name="Users" stroke="var(--accent-green)" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Channels */}
            <div className="rounded-2xl border border-border-base bg-bg-card p-5 shadow-card">
              <h3 className="mb-3 text-sm font-bold text-text-primary">Traffic by channel</h3>
              <ul className="space-y-2">
                {summary.channels.map((c) => {
                  const max = summary.channels[0]?.sessions || 1;
                  return (
                    <li key={c.channel}>
                      <div className="mb-0.5 flex justify-between text-xs">
                        <span className="text-text-secondary">{c.channel}</span>
                        <span className="tabular-nums text-text-primary">{c.sessions.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-accent-blue"
                          style={{ width: `${(c.sessions / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Top landing pages */}
            <div className="rounded-2xl border border-border-base bg-bg-card p-5 shadow-card">
              <h3 className="mb-3 text-sm font-bold text-text-primary">Top landing pages</h3>
              <div className="space-y-2">
                {summary.topPages.map((p) => (
                  <div key={p.page} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-text-secondary">{p.page}</span>
                    <span className="shrink-0 tabular-nums text-text-primary">{p.sessions.toLocaleString()}</span>
                    {p.conversions > 0 ? (
                      <span className="shrink-0 rounded-full bg-accent-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-green">
                        {p.conversions} conv
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
