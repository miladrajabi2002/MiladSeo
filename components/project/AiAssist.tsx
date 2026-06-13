"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { apiGet, apiPost, errorMessage } from "@/lib/client";
import type { AiConfigStatus } from "@/lib/types";

interface AiAssistProps {
  projectId: number | string;
  area: "overview" | "insights" | "health" | "onpage";
  /** For the on-page tab: the URL currently being inspected */
  getUrl?: () => string | undefined;
}

/** Renders a small subset of Markdown (bold, bullets, headings) safely. */
function renderInline(text: string, key: number) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-text-primary">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (/^#{1,6}\s/.test(trimmed)) {
          return (
            <p key={i} className="mt-2 text-sm font-bold text-text-primary">
              {renderInline(trimmed.replace(/^#{1,6}\s/, ""), i)}
            </p>
          );
        }
        if (/^(\*\*[^*]+\*\*:?)$/.test(trimmed)) {
          return (
            <p key={i} className="mt-2 font-bold text-text-primary">
              {renderInline(trimmed, i)}
            </p>
          );
        }
        if (/^[-*•]\s/.test(trimmed)) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-accent-blue">•</span>
              <span>{renderInline(trimmed.replace(/^[-*•]\s/, ""), i)}</span>
            </p>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <p key={i} className="pl-1">
              {renderInline(trimmed, i)}
            </p>
          );
        }
        return <p key={i}>{renderInline(trimmed, i)}</p>;
      })}
    </div>
  );
}

export default function AiAssist({ projectId, area, getUrl }: AiAssistProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    apiGet<AiConfigStatus>("/api/settings/ai")
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, []);

  if (!configured) return null;

  const run = async (q?: string) => {
    setLoading(true);
    setAnswer(null);
    try {
      const result = await apiPost<{ answer: string }>(
        `/api/projects/${projectId}/ai-assist`,
        { area, question: q, url: getUrl?.() }
      );
      setAnswer(result.answer);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-accent-blue/30 bg-accent-blue/[0.04] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
            <Sparkles size={15} />
          </span>
          <h3 className="text-sm font-bold text-text-primary">AI Assist</h3>
        </div>
        {!open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              if (!answer) void run();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Sparkles size={13} /> Analyze this tab
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-text-muted transition-colors hover:text-text-primary"
            aria-label="Close AI Assist"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              {loading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-text-muted">
                  <Loader2 size={15} className="animate-spin" /> Thinking…
                </div>
              ) : answer ? (
                <Markdown text={answer} />
              ) : (
                <p className="py-2 text-sm text-text-muted">
                  Ask anything about this tab&apos;s data, or click “Analyze this tab”.
                </p>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (question.trim()) void run(question.trim());
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a follow-up question…"
                  className="flex-1 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
