"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Boxes, Copy, Loader2, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { apiPost, errorMessage } from "@/lib/client";
import type { KeywordClusterResult } from "@/lib/types";

const INTENT_STYLE: Record<string, string> = {
  informational: "bg-accent-blue/10 text-accent-blue",
  commercial: "bg-accent-yellow/10 text-accent-yellow",
  transactional: "bg-accent-green/10 text-accent-green",
  navigational: "bg-violet-500/10 text-violet-500",
  other: "bg-bg-secondary text-text-muted",
};

/** Button + modal that groups the project's keywords into AI topic clusters. */
export default function AiClusterButton({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<KeywordClusterResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setOpen(true);
    setRunning(true);
    setResult(null);
    try {
      const r = await apiPost<KeywordClusterResult>(`/api/projects/${projectId}/ai-cluster`);
      setResult(r);
    } catch (error) {
      toast.error(errorMessage(error));
      setOpen(false);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void run()}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-blue to-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Boxes size={14} />
        AI Cluster
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="AI keyword clusters">
        {running ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
            <Loader2 size={16} className="animate-spin" /> Grouping keywords by topic &amp; intent…
          </div>
        ) : result ? (
          <div className="space-y-3">
            {result.clusters.map((c, i) => (
              <div key={i} className="rounded-xl border border-border-base bg-bg-secondary/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-text-primary">{c.name}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      INTENT_STYLE[c.intent] ?? INTENT_STYLE.other
                    }`}
                  >
                    {c.intent}
                  </span>
                  <span className="text-xs text-text-muted">{c.keywords.length} keywords</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(c.keywords.join("\n"));
                      toast.success(`Copied ${c.keywords.length} keywords`);
                    }}
                    className="ml-auto flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-md bg-bg-card px-2 py-0.5 text-xs text-text-secondary"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-text-muted">
              <Sparkles size={11} /> {result.clusters.length} clusters · {result.model}
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
