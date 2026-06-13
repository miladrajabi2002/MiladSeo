"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Check,
  KeyRound,
  Loader2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut, errorMessage } from "@/lib/client";
import type { AiAnalysis, AiConfigStatus, AiProvider, AiRecommendation } from "@/lib/types";

const PRIORITY_STYLE: Record<AiRecommendation["priority"], string> = {
  high: "bg-accent-red/10 text-accent-red",
  medium: "bg-accent-yellow/10 text-accent-yellow",
  low: "bg-accent-blue/10 text-accent-blue",
};

const CATEGORY_LABEL: Record<AiRecommendation["category"], string> = {
  content: "Content",
  technical: "Technical",
  keywords: "Keywords",
  performance: "Performance",
  onpage: "On-page",
  links: "Links",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-accent-green";
  if (score >= 50) return "text-accent-yellow";
  return "text-accent-red";
}

export default function AiPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [status, setStatus] = useState<AiConfigStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<AiProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);

  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [running, setRunning] = useState(false);

  const loadStatus = useCallback(() => {
    apiGet<AiConfigStatus>("/api/settings/ai")
      .then((s) => {
        setStatus(s);
        setShowForm(!s.configured);
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const inputClass =
    "mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue";

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await apiPut<AiConfigStatus>("/api/settings/ai", {
        provider,
        apiKey,
        model,
      });
      toast.success("Connected — credentials verified");
      setStatus(saved);
      setShowForm(false);
      setApiKey("");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Remove the stored AI API key?")) return;
    try {
      const result = await apiDelete<AiConfigStatus>("/api/settings/ai");
      setStatus(result);
      setAnalysis(null);
      setShowForm(true);
      toast.success("AI key removed");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setAnalysis(null);
    toast("Analysing your SEO data… this can take up to a minute", { icon: "🤖" });
    try {
      const result = await apiPost<AiAnalysis>(`/api/projects/${projectId}/ai-analysis`);
      setAnalysis(result);
      toast.success("Analysis ready");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRunning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* Connection card */}
      <div className="rounded-2xl border border-border-base bg-bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-text-primary">AI SEO Assistant</h2>
              <p className="text-xs text-text-secondary">
                {status?.configured
                  ? `Connected to ${status.provider === "anthropic" ? "Claude" : "OpenAI"} · ${status.model}`
                  : "Connect Claude or OpenAI to get an expert audit of this site"}
              </p>
            </div>
          </div>
          {status?.configured && !showForm ? (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-accent-green/10 px-2 py-0.5 text-xs font-semibold text-accent-green">
                <Check size={12} /> Connected
              </span>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-lg border border-border-base px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Change
              </button>
              <button
                type="button"
                aria-label="Remove AI key"
                onClick={() => void handleDisconnect()}
                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:text-accent-red"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : null}
        </div>

        {showForm ? (
          <form onSubmit={(e) => void handleSave(e)} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-text-secondary">
                Provider
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AiProvider)}
                  className={inputClass}
                >
                  <option value="anthropic">Claude (Anthropic)</option>
                  <option value="openai">ChatGPT (OpenAI)</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-text-secondary">
                Model <span className="text-text-muted">(optional)</span>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider === "anthropic" ? "claude-opus-4-8" : "gpt-4o"}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-text-secondary">
              API key
              <div className="relative">
                <KeyRound
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === "anthropic" ? "sk-ant-…" : "sk-…"}
                  className={`${inputClass} pl-8`}
                  autoComplete="off"
                />
              </div>
              <span className="mt-1 block text-xs text-text-muted">
                Stored server-side only and never shown again. We verify it before saving.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              {status?.configured ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setApiKey("");
                  }}
                  className="rounded-lg border border-border-base px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? "Verifying…" : "Connect"}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* Run + results */}
      {status?.configured && !showForm ? (
        <div className="flex items-center justify-between rounded-2xl border border-border-base bg-bg-card p-5">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Full SEO audit</h3>
            <p className="text-xs text-text-secondary">
              Analyses keywords, traffic, CTR gaps, cannibalization and Core Web Vitals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRun()}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {running ? "Analysing…" : analysis ? "Re-run analysis" : "Run analysis"}
          </button>
        </div>
      ) : null}

      {analysis ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Score + summary */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border-base bg-bg-card p-5 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-bg-secondary px-6 py-4">
              <span className={`text-4xl font-bold tabular-nums ${scoreColor(analysis.healthScore)}`}>
                {analysis.healthScore}
              </span>
              <span className="text-[11px] text-text-muted">health score</span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">{analysis.summary}</p>
          </div>

          {/* Quick wins + risks */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {analysis.quickWins.length > 0 ? (
              <div className="rounded-2xl border border-border-base bg-bg-card p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-accent-green">
                  <Zap size={15} /> Quick wins
                </h3>
                <ul className="space-y-2">
                  {analysis.quickWins.map((win, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <Check size={15} className="mt-0.5 shrink-0 text-accent-green" />
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {analysis.risks.length > 0 ? (
              <div className="rounded-2xl border border-border-base bg-bg-card p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-accent-red">
                  <AlertTriangle size={15} /> Risks
                </h3>
                <ul className="space-y-2">
                  {analysis.risks.map((risk, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-accent-red" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary">
              Recommendations ({analysis.recommendations.length})
            </h3>
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="rounded-2xl border border-border-base bg-bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${PRIORITY_STYLE[rec.priority]}`}>
                    {rec.priority}
                  </span>
                  <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                    {CATEGORY_LABEL[rec.category] ?? rec.category}
                  </span>
                  <span className="text-[11px] text-text-muted">effort: {rec.effort}</span>
                  <h4 className="w-full text-sm font-semibold text-text-primary sm:w-auto sm:flex-1">
                    {rec.title}
                  </h4>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{rec.detail}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-accent-green">
                  <Zap size={12} /> {rec.impact}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-text-muted">
            Generated by {analysis.provider === "anthropic" ? "Claude" : "OpenAI"} ({analysis.model}) ·{" "}
            {new Date(analysis.generatedAt).toLocaleString()}
          </p>
        </motion.div>
      ) : null}

      {!status?.configured ? (
        <p className="rounded-xl border border-dashed border-border-base bg-bg-card p-4 text-center text-xs text-text-muted">
          Get a free API key from{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue underline underline-offset-2"
          >
            Anthropic Console
          </a>{" "}
          or{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue underline underline-offset-2"
          >
            OpenAI Platform
          </a>
          , paste it above, and run a full audit.
        </p>
      ) : null}
    </motion.div>
  );
}
