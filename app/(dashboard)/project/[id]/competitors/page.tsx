"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Loader2, Plus, Swords, Trash2, Zap } from "lucide-react";
import { apiDelete, apiGet, apiPost, errorMessage } from "@/lib/client";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import type { CompetitorComparison } from "@/lib/types";

function PosCell({ value, best }: { value: number | null; best: boolean }) {
  if (value === null) {
    return <span className="text-xs text-text-muted">–</span>;
  }
  return (
    <span
      className={`inline-flex min-w-[28px] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
        best
          ? "bg-accent-green/15 text-accent-green"
          : "bg-bg-secondary text-text-secondary"
      }`}
    >
      {value}
    </span>
  );
}

export default function CompetitorsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [data, setData] = useState<CompetitorComparison | null>(null);
  const [domain, setDomain] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState(false);
  const [keywords, setKeywords] = useState("");

  const load = useCallback(() => {
    if (!projectId) return;
    apiGet<CompetitorComparison>(`/api/projects/${projectId}/competitors`)
      .then(setData)
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setAdding(true);
    try {
      await apiPost(`/api/projects/${projectId}/competitors`, {
        domain,
        label: label || undefined,
      });
      toast.success("Competitor added");
      setDomain("");
      setLabel("");
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (competitorId: number) => {
    try {
      await apiDelete(`/api/projects/${projectId}/competitors?competitorId=${competitorId}`);
      toast.success("Competitor removed");
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const check = async () => {
    setChecking(true);
    toast("Checking Google SERPs — this can take a minute…", { icon: "⚔️" });
    try {
      const list = keywords
        .split("\n")
        .map((k) => k.trim())
        .filter(Boolean);
      const result = await apiPost<{ checked: number }>(
        `/api/projects/${projectId}/competitors/check`,
        list.length > 0 ? { keywords: list } : undefined
      );
      toast.success(`Checked ${result.checked} keyword(s)`);
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setChecking(false);
    }
  };

  const domains = data?.domains ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2">
        <Swords size={18} className="text-accent-blue" />
        <h2 className="text-base font-semibold text-text-primary">Competitor SERP Tracking</h2>
      </div>

      <p className="rounded-lg border border-dashed border-border-base bg-bg-secondary/40 px-3 py-2 text-xs text-text-muted">
        Add competitor domains and run a live Google SERP check to compare positions head-to-head.
        SERP scraping is best-effort — Google may rate-limit server requests, in which case positions
        show as “–”.
      </p>

      {/* Add competitor + domains list */}
      <div className="rounded-2xl border border-border-base bg-bg-card p-5 shadow-card">
        <form onSubmit={(e) => void add(e)} className="flex flex-wrap items-end gap-2">
          <label className="flex-1 text-sm font-medium text-text-secondary">
            Competitor domain
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="competitor.com"
              className="mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
            />
          </label>
          <label className="flex-1 text-sm font-medium text-text-secondary">
            Label (optional)
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Main rival"
              className="mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
            />
          </label>
          <button
            type="submit"
            disabled={adding}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={15} /> Add
          </button>
        </form>

        {domains.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {domains.map((d) => (
              <span
                key={d.id}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  d.isSelf
                    ? "bg-accent-blue/10 text-accent-blue"
                    : "bg-bg-secondary text-text-secondary"
                }`}
              >
                {d.label ? `${d.label} · ` : ""}
                {d.domain}
                {!d.isSelf ? (
                  <button
                    type="button"
                    aria-label={`Remove ${d.domain}`}
                    onClick={() => void remove(d.id)}
                    className="text-text-muted transition-colors hover:text-accent-red"
                  >
                    <Trash2 size={12} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Run check */}
      <div className="rounded-2xl border border-border-base bg-bg-card p-5 shadow-card">
        <h3 className="text-sm font-bold text-text-primary">Run a SERP check</h3>
        <p className="mt-0.5 text-xs text-text-secondary">
          Leave the box empty to check your top tracked keywords, or paste specific keywords (one per
          line).
        </p>
        <textarea
          rows={3}
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={"keyword one\nkeyword two"}
          className="mt-2 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => void check()}
            disabled={checking}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {checking ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {checking ? "Checking…" : "Check SERPs now"}
          </button>
        </div>
      </div>

      {/* Comparison table */}
      {data === null ? (
        <TableSkeleton rows={6} />
      ) : data.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-bg-card p-12 text-center">
          <p className="text-2xl">⚔️</p>
          <h3 className="mt-3 text-lg font-semibold text-text-primary">No SERP data yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
            Add at least one competitor and run a SERP check to see the head-to-head comparison.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-base bg-bg-card shadow-card">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-4 py-2.5">Keyword</th>
                {domains.map((d) => (
                  <th key={d.id} className="px-4 py-2.5">
                    <span className={d.isSelf ? "text-accent-blue" : ""}>
                      {d.label || d.domain}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => {
                const present = domains
                  .map((d) => row.positions[d.domain])
                  .filter((p): p is number => p !== null && p !== undefined);
                const best = present.length > 0 ? Math.min(...present) : null;
                return (
                  <tr
                    key={row.keyword}
                    className="border-b border-border-base transition-colors last:border-0 hover:bg-bg-secondary"
                  >
                    <td className="max-w-[280px] px-4 py-2.5">
                      <span className="block truncate text-sm text-text-primary">{row.keyword}</span>
                    </td>
                    {domains.map((d) => {
                      const pos = row.positions[d.domain] ?? null;
                      return (
                        <td key={d.id} className="px-4 py-2.5">
                          <PosCell value={pos} best={pos !== null && pos === best} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
