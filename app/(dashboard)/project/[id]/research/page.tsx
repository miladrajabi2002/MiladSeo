"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Check, Copy, HelpCircle, Lightbulb, Loader2, Plus, Search } from "lucide-react";
import { apiGet, apiPost, errorMessage } from "@/lib/client";
import type { KeywordResearch } from "@/lib/types";

type Tab = "all" | "questions";

export default function ResearchPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [seed, setSeed] = useState("");
  const [data, setData] = useState<KeywordResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [adding, setAdding] = useState<string | null>(null);

  const addKeyword = async (text: string) => {
    setAdding(text);
    try {
      await apiPost(`/api/projects/${projectId}/keywords`, { text });
      toast.success(`Added “${text}”`);
      setData((prev) =>
        prev
          ? {
              ...prev,
              ideas: prev.ideas.map((i) =>
                i.text === text ? { ...i, tracked: true } : i
              ),
            }
          : prev
      );
      window.dispatchEvent(new Event("project-synced"));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAdding(null);
    }
  };

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!seed.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const result = await apiGet<KeywordResearch>(
        `/api/projects/${projectId}/research?q=${encodeURIComponent(seed.trim())}`
      );
      setData(result);
      if (result.total === 0) toast("No suggestions found for that seed", { icon: "🤔" });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const ideas = (data?.ideas ?? []).filter((i) => (tab === "questions" ? i.question : true));

  const copyAll = () => {
    const text = ideas.map((i) => i.text).join("\n");
    void navigator.clipboard.writeText(text);
    toast.success(`Copied ${ideas.length} keywords`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <form onSubmit={(e) => void run(e)} className="flex gap-2">
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Seed keyword, e.g. آپارتمان اجاره‌ای or cheap flights"
          className="flex-1 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? "Searching…" : "Find keywords"}
        </button>
      </form>

      {data === null ? (
        <p className="rounded-xl border border-dashed border-border-base bg-bg-card p-6 text-center text-sm text-text-muted">
          Enter a seed keyword to discover real searches people type on Google
          (via Autocomplete — free). Results are tailored to this project&apos;s location.
        </p>
      ) : (
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-accent-yellow" />
              <h3 className="text-sm font-bold text-text-primary">
                {data.total} ideas for “{data.seed}”
              </h3>
              <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] text-text-muted">
                {data.locale}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border-base p-0.5">
                {(["all", "questions"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      tab === t ? "bg-accent-blue text-white" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t === "all" ? "All" : "Questions"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={copyAll}
                className="flex items-center gap-1.5 rounded-lg border border-border-base px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>

          {ideas.length === 0 ? (
            <p className="text-sm text-text-muted">No keywords in this view.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ideas.map((idea) => (
                <li
                  key={idea.text}
                  className="flex items-center gap-2 rounded-lg bg-bg-secondary/60 px-3 py-2 text-sm text-text-primary"
                >
                  {idea.question ? (
                    <HelpCircle size={13} className="shrink-0 text-accent-blue" />
                  ) : (
                    <Search size={13} className="shrink-0 text-text-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{idea.text}</span>
                  {idea.tracked ? (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-accent-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-green">
                      <Check size={10} /> tracked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void addKeyword(idea.text)}
                      disabled={adding === idea.text}
                      aria-label={`Track “${idea.text}”`}
                      title="Add to tracked keywords"
                      className="flex shrink-0 items-center gap-0.5 rounded-full border border-border-base px-1.5 py-0.5 text-[10px] font-semibold text-text-muted transition-colors hover:border-accent-blue hover:text-accent-blue disabled:opacity-50"
                    >
                      {adding === idea.text ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Plus size={10} />
                      )}
                      track
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
}
