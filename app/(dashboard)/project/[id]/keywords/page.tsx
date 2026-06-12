"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import KeywordsTable from "@/components/project/KeywordsTable";
import Modal from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, apiPost, errorMessage } from "@/lib/client";
import type { KeywordRow } from "@/lib/types";

export default function KeywordsPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [rows, setRows] = useState<KeywordRow[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkGroup, setBulkGroup] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!projectId) return;
    apiGet<KeywordRow[]>(`/api/projects/${projectId}/keywords`)
      .then(setRows)
      .catch((error) => {
        toast.error(errorMessage(error));
        setRows([]);
      });
  }, [projectId]);

  useEffect(() => {
    load();
    window.addEventListener("project-synced", load);
    return () => window.removeEventListener("project-synced", load);
  }, [load]);

  const handleBulkAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const keywords = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (keywords.length === 0) return;

    setSubmitting(true);
    try {
      const result = await apiPost<{ created: number; skipped: number }>(
        `/api/projects/${projectId}/keywords/bulk`,
        { keywords, group: bulkGroup || undefined }
      );
      toast.success(
        `${result.created} keyword${result.created === 1 ? "" : "s"} added${
          result.skipped > 0 ? `, ${result.skipped} skipped (duplicates)` : ""
        }`
      );
      setModalOpen(false);
      setBulkText("");
      setBulkGroup("");
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">
          All Keywords{rows ? ` (${rows.length})` : ""}
        </h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          <Plus size={14} />
          Add Keywords
        </button>
      </div>

      {rows === null ? (
        <TableSkeleton rows={10} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-base bg-bg-card p-16 text-center">
          <p className="text-2xl">🔍</p>
          <h3 className="mt-3 text-lg font-semibold text-text-primary">
            No keywords yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
            Run a sync to import keywords from Search Console automatically, or
            add them manually.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            Add Keywords
          </button>
        </div>
      ) : (
        <KeywordsTable projectId={projectId} rows={rows} onRowsChanged={load} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Keywords"
      >
        <form onSubmit={(e) => void handleBulkAdd(e)}>
          <label className="block text-sm font-medium text-text-secondary">
            Keywords (one per line)
            <textarea
              required
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"rent a car dubai\ncheap car rental sharjah"}
              className="mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-text-secondary">
            Group (optional)
            <input
              type="text"
              value={bulkGroup}
              onChange={(e) => setBulkGroup(e.target.value)}
              placeholder="e.g. Airport"
              className="mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue"
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-border-base px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add Keywords"}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
