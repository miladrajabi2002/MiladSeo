"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { RefreshCw, SearchCheck } from "lucide-react";
import { apiPost, errorMessage } from "@/lib/client";
import type { IndexStatusRow } from "@/lib/types";

interface IndexStatusViewProps {
  projectId: number;
  rows: IndexStatusRow[];
  onChanged: () => void;
}

function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (verdict === null) {
    return (
      <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-text-muted">
        Not checked
      </span>
    );
  }
  const styles: Record<string, string> = {
    PASS: "bg-accent-green/15 text-accent-green",
    FAIL: "bg-accent-red/15 text-accent-red",
    NEUTRAL: "bg-accent-yellow/15 text-accent-yellow",
    PARTIAL: "bg-accent-yellow/15 text-accent-yellow",
  };
  const labels: Record<string, string> = {
    PASS: "Indexed",
    FAIL: "Not indexed",
    NEUTRAL: "Excluded",
    PARTIAL: "Partial",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        styles[verdict] ?? "bg-bg-secondary text-text-muted"
      }`}
    >
      {labels[verdict] ?? verdict}
    </span>
  );
}

export default function IndexStatusView({
  projectId,
  rows,
  onChanged,
}: IndexStatusViewProps) {
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingPath, setCheckingPath] = useState<string | null>(null);

  const runCheck = async (urlPaths?: string[]) => {
    try {
      await apiPost(`/api/projects/${projectId}/index-status`, {
        urlPaths,
      });
      toast.success("Index check complete");
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const checkAll = async () => {
    setCheckingAll(true);
    toast("Checking pages — Google inspects one URL at a time…", { icon: "🔍" });
    await runCheck();
    setCheckingAll(false);
  };

  const checkOne = async (urlPath: string) => {
    setCheckingPath(urlPath);
    await runCheck([urlPath]);
    setCheckingPath(null);
  };

  const indexed = rows.filter((r) => r.verdict === "PASS").length;
  const problems = rows.filter(
    (r) => r.verdict !== null && r.verdict !== "PASS"
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-border-base bg-bg-card shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-base p-5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <SearchCheck size={15} className="text-accent-green" />
            <h3 className="text-sm font-semibold text-text-primary">
              Index Coverage
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            {indexed} indexed · {problems} with issues ·{" "}
            {rows.length - indexed - problems} unchecked — via URL Inspection
            API (2,000 checks/day)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void checkAll()}
          disabled={checkingAll || checkingPath !== null}
          className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw size={13} className={checkingAll ? "animate-spin" : ""} />
          {checkingAll ? "Checking…" : "Check stale batch (25)"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-border-base text-xs font-semibold uppercase tracking-wider text-text-muted">
              <th className="px-4 py-2.5">Page</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Coverage</th>
              <th className="px-4 py-2.5">Last Crawl</th>
              <th className="px-4 py-2.5">Checked</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.urlPath}
                className="border-b border-border-base transition-colors last:border-0 hover:bg-bg-secondary"
              >
                <td className="max-w-[260px] px-4 py-2.5">
                  <span className="block truncate font-mono text-xs text-text-primary">
                    {row.urlPath}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <VerdictBadge verdict={row.verdict} />
                </td>
                <td className="max-w-[200px] px-4 py-2.5">
                  <span className="block truncate text-xs text-text-secondary">
                    {row.coverageState ?? "–"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs tabular-nums text-text-secondary">
                  {row.lastCrawlTime
                    ? format(parseISO(row.lastCrawlTime), "MM/dd HH:mm")
                    : "–"}
                </td>
                <td className="px-4 py-2.5 text-xs tabular-nums text-text-muted">
                  {row.checkedAt
                    ? format(parseISO(row.checkedAt), "MM/dd HH:mm")
                    : "never"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => void checkOne(row.urlPath)}
                    disabled={checkingAll || checkingPath !== null}
                    className="rounded-lg border border-border-base px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
                  >
                    {checkingPath === row.urlPath ? "…" : "Check"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  No pages discovered yet — run a sync first.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
