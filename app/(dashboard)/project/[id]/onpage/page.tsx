"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Check, Loader2, Search, X } from "lucide-react";
import AiAssist from "@/components/project/AiAssist";
import { apiGet, errorMessage } from "@/lib/client";
import type { OnPageReport } from "@/lib/types";

function Row({
  label,
  ok: isOk,
  value,
  hint,
}: {
  label: string;
  ok: boolean | null;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border-base py-2.5 last:border-0">
      <span className="mt-0.5 shrink-0">
        {isOk === null ? (
          <span className="block h-4 w-4 rounded-full bg-bg-secondary" />
        ) : isOk ? (
          <Check size={16} className="text-accent-green" />
        ) : (
          <X size={16} className="text-accent-red" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="break-words text-sm text-text-primary">{value || "—"}</p>
        {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export default function OnPagePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<OnPageReport | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setReport(null);
    try {
      const query = url.trim() ? `?url=${encodeURIComponent(url.trim())}` : "";
      const result = await apiGet<OnPageReport>(`/api/projects/${projectId}/onpage${query}`);
      setReport(result);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
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
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Leave empty for the homepage, or paste any URL/path"
          className="flex-1 rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? "Checking…" : "Check"}
        </button>
      </form>

      {report ? (
        <div className="space-y-5">
          {/* Status + redirects */}
          <div className="rounded-2xl border border-border-base bg-bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  report.status >= 200 && report.status < 300
                    ? "bg-accent-green/10 text-accent-green"
                    : "bg-accent-red/10 text-accent-red"
                }`}
              >
                {report.status}
              </span>
              <span className="truncate text-sm text-text-primary">{report.finalUrl}</span>
            </div>
            {report.redirects.length > 0 ? (
              <p className="text-xs text-accent-yellow">
                {report.redirects.length} redirect{report.redirects.length === 1 ? "" : "s"}:{" "}
                {report.redirects.map((h) => `${h.status}`).join(" → ")} (fewer hops = better)
              </p>
            ) : (
              <p className="text-xs text-text-muted">No redirects — direct response.</p>
            )}
          </div>

          {/* Meta / on-page */}
          <div className="rounded-2xl border border-border-base bg-bg-card p-5">
            <h3 className="mb-2 text-sm font-bold text-text-primary">On-page</h3>
            <Row
              label="Title"
              ok={report.titleLength >= 10 && report.titleLength <= 65}
              value={report.title}
              hint={`${report.titleLength} chars (aim 10–65)`}
            />
            <Row
              label="Meta description"
              ok={report.metaDescriptionLength >= 50 && report.metaDescriptionLength <= 165}
              value={report.metaDescription}
              hint={`${report.metaDescriptionLength} chars (aim 50–165)`}
            />
            <Row
              label="H1"
              ok={report.h1Count === 1}
              value={report.h1.join(" · ")}
              hint={`${report.h1Count} found (exactly 1 is ideal) · ${report.h2Count} H2s`}
            />
            <Row label="Canonical" ok={Boolean(report.canonical)} value={report.canonical} />
            <Row
              label="Robots meta"
              ok={!report.robotsMeta || !/noindex/i.test(report.robotsMeta)}
              value={report.robotsMeta ?? "not set (indexable)"}
              hint={report.robotsMeta && /noindex/i.test(report.robotsMeta) ? "noindex blocks this page!" : undefined}
            />
            <Row label="Viewport" ok={Boolean(report.viewport)} value={report.viewport} hint="needed for mobile" />
            <Row label="Lang" ok={Boolean(report.lang)} value={report.lang} />
            <Row
              label="Word count"
              ok={report.wordCount >= 300}
              value={String(report.wordCount)}
              hint="thin content under ~300 words ranks worse"
            />
            <Row
              label="Images missing alt"
              ok={report.imagesMissingAlt === 0}
              value={`${report.imagesMissingAlt} of ${report.imageCount}`}
            />
          </div>

          {/* Social + schema */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border-base bg-bg-card p-5">
              <h3 className="mb-2 text-sm font-bold text-text-primary">Social tags</h3>
              <Row label="og:title" ok={Boolean(report.og.title)} value={report.og.title} />
              <Row label="og:description" ok={Boolean(report.og.description)} value={report.og.description} />
              <Row label="og:image" ok={Boolean(report.og.image)} value={report.og.image} />
              <Row label="twitter:card" ok={Boolean(report.twitterCard)} value={report.twitterCard} />
            </div>
            <div className="rounded-2xl border border-border-base bg-bg-card p-5">
              <h3 className="mb-2 text-sm font-bold text-text-primary">Structured data & crawl</h3>
              <Row
                label="Schema (JSON-LD)"
                ok={report.schemaCount > 0}
                value={report.schemaTypes.join(", ")}
                hint={`${report.schemaCount} block(s)`}
              />
              <Row label="robots.txt" ok={report.robotsTxt} value={report.robotsTxt ? "found" : "missing"} />
              <Row
                label="Sitemap"
                ok={report.sitemapUrls.length > 0}
                value={report.sitemapUrls.join(", ")}
                hint={report.sitemapUrlCount !== null ? `${report.sitemapUrlCount} URLs listed` : undefined}
              />
            </div>
          </div>

          {/* Links on the page */}
          <div className="rounded-2xl border border-border-base bg-bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">
                Links on this page ({report.linksChecked} checked)
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  report.brokenLinkCount === 0
                    ? "bg-accent-green/10 text-accent-green"
                    : "bg-accent-red/10 text-accent-red"
                }`}
              >
                {report.brokenLinkCount} broken
              </span>
            </div>
            {report.linksChecked === 0 ? (
              <p className="text-sm text-text-muted">No links found on this page.</p>
            ) : report.brokenLinkCount === 0 ? (
              <p className="text-sm text-text-secondary">
                All {report.linksChecked} links respond OK. ✅
              </p>
            ) : (
              <ul className="space-y-1.5">
                {report.links
                  .filter((l) => !l.ok)
                  .map((l) => (
                    <li key={l.url} className="flex items-center gap-2 text-sm">
                      <span className="shrink-0 rounded bg-accent-red/10 px-1.5 py-0.5 text-[11px] font-bold text-accent-red">
                        {l.status === 0 ? "ERR" : l.status}
                      </span>
                      <span className="shrink-0 text-[11px] text-text-muted">
                        {l.internal ? "internal" : "external"}
                      </span>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
                      >
                        {l.url}
                      </a>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <AiAssist
            projectId={projectId}
            area="onpage"
            getUrl={() => report.finalUrl}
          />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-base bg-bg-card p-6 text-center text-sm text-text-muted">
          Enter a URL (or leave blank to check the homepage) to inspect its title, meta tags,
          headings, canonical, Open Graph, schema, redirects, robots.txt and sitemap.
        </p>
      )}
    </motion.div>
  );
}
