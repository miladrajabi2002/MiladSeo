"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, errorMessage } from "@/lib/client";
import type { AnnotationRow } from "@/lib/types";

export default function AnnotationsPanel({ projectId }: { projectId: number }) {
  const [annotations, setAnnotations] = useState<AnnotationRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    apiGet<AnnotationRow[]>(`/api/projects/${projectId}/annotations`)
      .then(setAnnotations)
      .catch((error) => toast.error(errorMessage(error)));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/projects/${projectId}/annotations`, {
        date,
        title: title.trim(),
        note: note.trim() || undefined,
      });
      toast.success("Annotation added");
      setTitle("");
      setNote("");
      setAdding(false);
      load();
      window.dispatchEvent(new Event("annotations-changed"));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/annotations/${id}`);
      toast.success("Annotation removed");
      load();
      window.dispatchEvent(new Event("annotations-changed"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
      className="flex h-full flex-col rounded-xl border border-border-base bg-bg-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote size={15} className="text-accent-yellow" />
          <h3 className="text-sm font-semibold text-text-primary">
            Annotations
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-lg border border-border-base px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      <p className="mt-0.5 text-xs text-text-muted">
        Log site changes and see their impact on the charts
      </p>

      {adding ? (
        <form
          onSubmit={(e) => void handleAdd(e)}
          className="mt-3 space-y-2 rounded-lg border border-border-base bg-bg-secondary p-3"
        >
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-xs outline-none focus:border-accent-blue"
          />
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Rewrote homepage titles"
            className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-xs outline-none focus:border-accent-blue"
          />
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Details (optional)"
            className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-xs outline-none focus:border-accent-blue"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
        {annotations === null ? (
          <div className="h-20 animate-pulse rounded-lg bg-bg-secondary" />
        ) : annotations.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">
            No annotations yet. Log your first change!
          </p>
        ) : (
          annotations.map((a) => (
            <div
              key={a.id}
              className="group flex items-start gap-2 rounded-lg border border-border-base p-2.5"
            >
              <span className="mt-0.5 shrink-0 rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-text-secondary">
                {format(parseISO(a.date), "MM/dd")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-text-primary">
                  {a.title}
                </p>
                {a.note ? (
                  <p className="mt-0.5 text-xs text-text-secondary">{a.note}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={`Delete annotation ${a.title}`}
                onClick={() => void handleDelete(a.id)}
                className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-opacity hover:text-accent-red group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
