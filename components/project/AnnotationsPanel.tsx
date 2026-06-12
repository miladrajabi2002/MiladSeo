"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarDays, FileText, Plus, StickyNote, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, errorMessage } from "@/lib/client";
import { useCalendar } from "@/contexts/CalendarContext";
import { formatDateShort, formatDateLong, todayTehranISO, gregToShamsiLabel } from "@/lib/jalaali";
import type { AnnotationRow } from "@/lib/types";

export default function AnnotationsPanel({ projectId }: { projectId: number }) {
  const { calendar } = useCalendar();
  const [annotations, setAnnotations] = useState<AnnotationRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(() =>
    calendar === "shamsi" ? todayTehranISO() : new Date().toISOString().substring(0, 10)
  );
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

  // Keep default date in sync with calendar mode
  useEffect(() => {
    setDate(
      calendar === "shamsi"
        ? todayTehranISO()
        : new Date().toISOString().substring(0, 10)
    );
  }, [calendar]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote size={15} className="text-accent-yellow" />
          <h3 className="text-sm font-semibold text-text-primary">Annotations</h3>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
            adding
              ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
              : "border-border-base text-text-secondary hover:text-text-primary"
          }`}
        >
          <Plus size={12} className={`transition-transform ${adding ? "rotate-45" : ""}`} />
          {adding ? "Cancel" : "Add"}
        </button>
      </div>
      <p className="mt-0.5 text-xs text-text-muted">
        Log site changes and see their impact on the charts
      </p>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.form
            key="add-form"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onSubmit={(e) => void handleAdd(e)}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border-base bg-bg-secondary p-4 shadow-sm space-y-3">
              {/* Date field */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <CalendarDays size={10} />
                  Date
                  {calendar === "shamsi" && (
                    <span className="ml-auto normal-case font-normal text-accent-blue">
                      شمسی: {gregToShamsiLabel(date)}
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/10"
                />
              </div>

              {/* Title field */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <FileText size={10} />
                  Title <span className="text-accent-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rewrote homepage titles"
                  className="w-full rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/10"
                />
              </div>

              {/* Note field */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <StickyNote size={10} />
                  Note <span className="text-text-muted font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add more context about this change…"
                  className="w-full resize-none rounded-lg border border-border-base bg-bg-card px-3 py-2 text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/10"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-base">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save annotation"
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
        {annotations === null ? (
          <>
            <div className="h-14 animate-pulse rounded-lg bg-bg-secondary" />
            <div className="h-14 animate-pulse rounded-lg bg-bg-secondary opacity-60" />
          </>
        ) : annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <StickyNote size={24} className="text-text-muted opacity-40" />
            <p className="text-xs text-text-muted">
              No annotations yet. Log your first change!
            </p>
          </div>
        ) : (
          annotations.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group flex items-start gap-2.5 rounded-xl border border-border-base p-3 transition-colors hover:border-accent-yellow/40 hover:bg-bg-secondary/50"
            >
              {/* Date badge */}
              <div className="shrink-0 text-center">
                <span className="block rounded-lg border border-border-base bg-bg-secondary px-2 py-1 text-[10px] font-bold tabular-nums text-accent-yellow leading-tight">
                  {formatDateShort(a.date, calendar)}
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-text-primary leading-snug">
                  {a.title}
                </p>
                {a.note ? (
                  <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
                    {a.note}
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] text-text-muted">
                  {formatDateLong(a.date, calendar)}
                </p>
              </div>

              {/* Delete */}
              <button
                type="button"
                aria-label={`Delete annotation ${a.title}`}
                onClick={() => void handleDelete(a.id)}
                className="shrink-0 rounded-lg p-1.5 text-text-muted opacity-0 transition-all hover:bg-accent-red/10 hover:text-accent-red group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
