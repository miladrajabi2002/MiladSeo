"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import GroupBadge from "@/components/ui/Badge";
import PositionBadge from "@/components/ui/PositionBadge";
import PositionLegend from "@/components/ui/PositionLegend";
import DeltaBadge from "@/components/ui/DeltaBadge";
import Sparkline from "@/components/ui/Sparkline";
import Modal from "@/components/ui/Modal";
import KeywordTrendModal from "@/components/project/KeywordTrendModal";
import { useDensity } from "@/contexts/DensityContext";
import { apiDelete, apiPatch, errorMessage } from "@/lib/client";
import type { KeywordRow } from "@/lib/types";

const PAGE_SIZE = 50;

type SortKey = "text" | "group" | "desktopPos" | "mobilePos" | "change";
type SortDirection = "asc" | "desc";
type PositionFilter = "all" | "top3" | "top10" | "top20" | "top50" | "beyond";
type MovementFilter = "all" | "improved" | "dropped" | "stable";

interface KeywordsTableProps {
  projectId: number;
  rows: KeywordRow[];
  onRowsChanged: () => void;
}

function compare(
  a: KeywordRow,
  b: KeywordRow,
  key: SortKey,
  direction: SortDirection
): number {
  const sign = direction === "asc" ? 1 : -1;
  if (key === "text" || key === "group") {
    const av = (a[key] ?? "").toLowerCase();
    const bv = (b[key] ?? "").toLowerCase();
    return av.localeCompare(bv) * sign;
  }
  const av = a[key];
  const bv = b[key];
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  return (av - bv) * sign;
}

function matchesPosition(row: KeywordRow, filter: PositionFilter): boolean {
  const p = row.desktopPos;
  switch (filter) {
    case "all":
      return true;
    case "top3":
      return p !== null && p <= 3;
    case "top10":
      return p !== null && p <= 10;
    case "top20":
      return p !== null && p <= 20;
    case "top50":
      return p !== null && p <= 50;
    case "beyond":
      return p !== null && p > 100;
  }
}

function matchesMovement(row: KeywordRow, filter: MovementFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "improved":
      return row.change !== null && row.change > 0;
    case "dropped":
      return row.change !== null && row.change < 0;
    case "stable":
      return row.change === null || row.change === 0;
  }
}

export default function KeywordsTable({
  projectId,
  rows,
  onRowsChanged,
}: KeywordsTableProps) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("all");
  const [movementFilter, setMovementFilter] = useState<MovementFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("desktopPos");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<KeywordRow | null>(null);
  const [editGroup, setEditGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const [trendKeywordId, setTrendKeywordId] = useState<number | null>(null);
  const closeTrend = useCallback(() => setTrendKeywordId(null), []);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const { cellPadding } = useDensity();

  /** Optimistically hide a keyword, then delete it after a 5s undo window. */
  const deleteKeyword = (row: KeywordRow) => {
    setHiddenIds((prev) => new Set(prev).add(row.id));
    let undone = false;

    const timer = setTimeout(() => {
      if (undone) return;
      apiDelete(`/api/projects/${projectId}/keywords?keywordId=${row.id}`)
        .then(() => onRowsChanged())
        .catch((error) => {
          toast.error(errorMessage(error));
          setHiddenIds((prev) => {
            const next = new Set(prev);
            next.delete(row.id);
            return next;
          });
        });
    }, 5000);

    toast(
      (t) => (
        <span className="flex items-center gap-3">
          <span className="text-sm">
            Deleted “{row.text.length > 24 ? `${row.text.slice(0, 24)}…` : row.text}”
          </span>
          <button
            type="button"
            onClick={() => {
              undone = true;
              clearTimeout(timer);
              setHiddenIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
              });
              toast.dismiss(t.id);
            }}
            className="rounded-md bg-accent-blue px-2 py-1 text-xs font-semibold text-white"
          >
            Undo
          </button>
        </span>
      ),
      { duration: 5000 }
    );
  };

  const groups = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.group).filter((g): g is string => g !== null))
      ).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((r) => !hiddenIds.has(r.id))
      .filter((r) => (term ? r.text.toLowerCase().includes(term) : true))
      .filter((r) => (groupFilter === "all" ? true : r.group === groupFilter))
      .filter((r) => matchesPosition(r, positionFilter))
      .filter((r) => matchesMovement(r, movementFilter))
      .sort((a, b) => compare(a, b, sortKey, sortDirection));
  }, [rows, hiddenIds, search, groupFilter, positionFilter, movementFilter, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const saveGroup = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiPatch(`/api/projects/${projectId}/keywords`, {
        keywordId: editing.id,
        group: editGroup,
      });
      toast.success(`Group updated for "${editing.text}"`);
      setEditing(null);
      onRowsChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const SortHeader = ({ label, sort }: { label: string; sort: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(sort)}
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary"
    >
      {label}
      {sortKey === sort ? (
        <motion.span
          key={sortDirection}
          initial={{ opacity: 0, y: sortDirection === "asc" ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex"
        >
          {sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        </motion.span>
      ) : (
        <ArrowUpDown size={12} className="opacity-40" />
      )}
    </button>
  );

  const selectClass =
    "rounded-lg border border-border-base bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue";

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search keywords…"
            className="w-full rounded-lg border border-border-base bg-bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent-blue"
          />
        </div>
        <select
          value={groupFilter}
          onChange={(e) => {
            setGroupFilter(e.target.value);
            setPage(0);
          }}
          className={selectClass}
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={positionFilter}
          onChange={(e) => {
            setPositionFilter(e.target.value as PositionFilter);
            setPage(0);
          }}
          className={selectClass}
        >
          <option value="all">All Positions</option>
          <option value="top3">Top 3</option>
          <option value="top10">Top 10</option>
          <option value="top20">Top 20</option>
          <option value="top50">Top 50</option>
          <option value="beyond">100+</option>
        </select>
        <select
          value={movementFilter}
          onChange={(e) => {
            setMovementFilter(e.target.value as MovementFilter);
            setPage(0);
          }}
          className={selectClass}
        >
          <option value="all">All Movement</option>
          <option value="improved">Improved</option>
          <option value="dropped">Dropped</option>
          <option value="stable">Stable</option>
        </select>
        <PositionLegend />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border-base bg-bg-card shadow-card">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-border-base">
              <th className="px-4 py-3">
                <SortHeader label="Keyword" sort="text" />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Group" sort="group" />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Desktop Pos" sort="desktopPos" />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Mobile" sort="mobilePos" />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Change" sort="change" />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Trend
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Page
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.03, 0.5),
                  ease: "easeOut",
                }}
                onClick={() => setTrendKeywordId(row.id)}
                className="group cursor-pointer border-b border-border-base transition-colors last:border-0 hover:bg-bg-secondary"
              >
                <td className={cellPadding}>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">
                        {row.text}
                      </p>
                      {row.urlPath ? (
                        <p className="truncate text-xs text-text-muted">
                          {row.urlPath}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit group for ${row.text}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditing(row);
                        setEditGroup(row.group ?? "");
                      }}
                      className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-opacity hover:text-accent-blue group-hover:opacity-100"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </td>
                <td className={cellPadding}>
                  <GroupBadge group={row.group} />
                </td>
                <td className={cellPadding}>
                  <PositionBadge position={row.desktopPos} />
                </td>
                <td className={cellPadding}>
                  <PositionBadge position={row.mobilePos} />
                </td>
                <td className={cellPadding}>
                  <DeltaBadge delta={row.change} />
                </td>
                <td className={cellPadding}>
                  <Sparkline data={row.trend} />
                </td>
                <td className={`max-w-[160px] truncate text-xs text-text-secondary ${cellPadding}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{row.urlPath ?? "–"}</span>
                    <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label={`Trend for ${row.text}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrendKeywordId(row.id);
                        }}
                        className="rounded p-1 text-text-muted transition-colors hover:text-accent-blue"
                      >
                        <LineChart size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${row.text}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteKeyword(row);
                        }}
                        className="rounded p-1 text-text-muted transition-colors hover:text-accent-red"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-muted">
                  No keywords match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
          <p>
            Showing {currentPage * PAGE_SIZE + 1}–
            {Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-border-base px-3 py-1.5 transition-colors hover:text-text-primary disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="tabular-nums">
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="flex items-center gap-1 rounded-lg border border-border-base px-3 py-1.5 transition-colors hover:text-text-primary disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {/* Per-keyword trend chart */}
      <KeywordTrendModal
        projectId={projectId}
        keywordId={trendKeywordId}
        onClose={closeTrend}
      />

      {/* Edit group modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit "${editing.text}"` : ""}
      >
        <label className="block text-sm font-medium text-text-secondary">
          Group
          <input
            type="text"
            list="keyword-groups"
            value={editGroup}
            onChange={(e) => setEditGroup(e.target.value)}
            placeholder="e.g. Airport"
            className="mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
          />
          <datalist id="keyword-groups">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          {groups.length > 0 ? (
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditGroup(g)}
                  className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-text-secondary transition-colors hover:text-accent-blue"
                >
                  {g}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEditGroup("")}
                className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-text-muted transition-colors hover:text-accent-red"
              >
                clear
              </button>
            </span>
          ) : null}
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="rounded-lg border border-border-base px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void saveGroup()}
            disabled={saving}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
