"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, FolderPlus, Plus, RefreshCw } from "lucide-react";
import ProjectCard from "@/components/dashboard/ProjectCard";
import Modal from "@/components/ui/Modal";
import { CardGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, apiPost, errorMessage } from "@/lib/client";
import type { ProjectSummary } from "@/lib/types";

const LOCATIONS = ["Iran", "UAE", "Saudi Arabia", "Egypt", "UK", "USA", "Other"];

const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#22c55e", "#06b6d4", "#6366f1", "#14b8a6", "#64748b",
];

interface GscSite {
  siteUrl: string;
  permissionLevel: string;
  eligible: boolean;
}

const PERMISSION_LABEL: Record<string, string> = {
  siteOwner: "Owner",
  siteFullUser: "Full User",
  siteRestrictedUser: "Restricted",
  siteUnverifiedUser: "Unverified",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    domain: "",
    gscProperty: "",
    location: "Iran",
    color: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [gscSites, setGscSites] = useState<GscSite[] | null>(null);
  const [loadingSites, setLoadingSites] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [clientGuideOpen, setClientGuideOpen] = useState(false);

  const load = useCallback(() => {
    apiGet<ProjectSummary[]>("/api/projects")
      .then(setProjects)
      .catch((error) => {
        toast.error(errorMessage(error));
        setProjects([]);
      });
  }, []);

  const fetchGscSites = useCallback(() => {
    setLoadingSites(true);
    apiGet<GscSite[]>("/api/gsc/sites")
      .then((sites) => setGscSites(sites))
      .catch(() => setGscSites([]))
      .finally(() => setLoadingSites(false));
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setGuideOpen(false);
    setClientGuideOpen(false);
    fetchGscSites();
  }, [fetchGscSites]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setGscSites(null);
    setGuideOpen(false);
    setClientGuideOpen(false);
  }, []);

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const google = params.get("google");
    if (google === "connected") {
      toast.success("Google account connected");
      window.history.replaceState({}, "", "/");
    } else if (google === "error") {
      toast.error("Google connection failed — check your OAuth credentials");
      window.history.replaceState({}, "", "/");
    }
  }, [load]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/api/projects", form);
      toast.success(`Project "${form.name}" created`);
      setModalOpen(false);
      setGscSites(null);
      setForm({ name: "", domain: "", gscProperty: "", location: "Iran", color: "" });
      load();
      window.dispatchEvent(new Event("projects-changed"));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue";

  const eligibleSites = gscSites?.filter((s) => s.eligible) ?? [];
  const restrictedSites = gscSites?.filter((s) => !s.eligible) ?? [];

  const totals = (projects ?? []).reduce(
    (acc, p) => {
      acc.keywords += p.keywordCount;
      acc.top10 += p.top10;
      acc.alerts += p.unreadAlerts;
      if (p.avgPosition !== null) {
        acc.posSum += p.avgPosition;
        acc.posCount += 1;
      }
      return acc;
    },
    { keywords: 0, top10: 0, alerts: 0, posSum: 0, posCount: 0 }
  );
  const avgPos =
    totals.posCount > 0 ? Math.round((totals.posSum / totals.posCount) * 10) / 10 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Track keyword rankings across your sites
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Add Project
        </button>
      </div>

      {/* Global stats bar */}
      {projects && projects.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5"
        >
          {[
            { label: "Projects", value: projects.length, color: "text-text-primary" },
            { label: "Keywords", value: totals.keywords.toLocaleString(), color: "text-text-primary" },
            { label: "In top 10", value: totals.top10.toLocaleString(), color: "text-accent-green" },
            { label: "Avg position", value: avgPos ?? "–", color: "text-accent-blue" },
            { label: "Unread alerts", value: totals.alerts, color: totals.alerts > 0 ? "text-accent-red" : "text-text-primary" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border-base bg-bg-card px-4 py-3 shadow-card"
            >
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-text-muted">{s.label}</p>
            </div>
          ))}
        </motion.div>
      ) : null}

      <div className="mt-6">
        {projects === null ? (
          <CardGridSkeleton />
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center rounded-2xl border border-dashed border-border-base bg-bg-card p-16 text-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary text-text-muted">
              <FolderPlus size={28} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-text-primary">
              Add your first project
            </h2>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              Connect a domain verified in Google Search Console and start
              tracking its keyword rankings.
            </p>
            <button
              type="button"
              onClick={openModal}
              className="mt-6 flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={16} />
              Add Project
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onChanged={load} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Guide / tutorial entry */}
      <Link
        href="/guide"
        className="mt-8 flex items-center gap-4 rounded-2xl border border-border-base bg-gradient-to-br from-accent-blue/10 to-violet-500/5 p-5 transition-shadow hover:shadow-card-hover"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
          <BookOpen size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-text-primary">
            راهنما و آموزش کامل · Complete Guide &amp; Tutorial
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            راه‌اندازی، استفاده، معرفی قابلیت‌ها و آموزش سئو (فارسی/English) — هرچه برای شروع لازم داری.
          </p>
        </div>
        <ChevronUp size={18} className="shrink-0 rotate-90 text-text-muted" />
      </Link>

      <Modal open={modalOpen} onClose={closeModal} title="Add Project">
        <form onSubmit={(e) => void handleCreate(e)}>
          <label className="block text-sm font-medium text-text-secondary">
            Project name
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Site"
              className={inputClass}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-text-secondary">
            Domain
            <input
              type="text"
              required
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="mysite.com"
              className={inputClass}
            />
          </label>

          {/* GSC property picker */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                GSC Property
              </span>
              <button
                type="button"
                onClick={fetchGscSites}
                disabled={loadingSites}
                className="flex items-center gap-1 text-xs text-accent-blue hover:opacity-80 disabled:opacity-50"
              >
                <RefreshCw size={11} className={loadingSites ? "animate-spin" : ""} />
                {loadingSites ? "Loading…" : "Refresh"}
              </button>
            </div>

            {gscSites !== null && eligibleSites.length > 0 ? (
              <>
                <select
                  required
                  value={form.gscProperty}
                  onChange={(e) => setForm({ ...form, gscProperty: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— pick a property —</option>
                  {eligibleSites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl}>
                      {s.siteUrl} ({PERMISSION_LABEL[s.permissionLevel] ?? s.permissionLevel})
                    </option>
                  ))}
                </select>
                {restrictedSites.length > 0 && (
                  <p className="mt-1 text-xs text-amber-500">
                    {restrictedSites.length} site(s) hidden — your account has Restricted access to them
                    and the Search Analytics API is blocked. To fix this, make yourself an Owner or Full User
                    in Search Console &rarr; Settings &rarr; Users and permissions.
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  required
                  value={form.gscProperty}
                  onChange={(e) => setForm({ ...form, gscProperty: e.target.value })}
                  placeholder="sc-domain:mysite.com"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-text-muted">
                  {loadingSites
                    ? "Fetching your Search Console properties…"
                    : gscSites !== null
                    ? "No eligible properties found. Add and verify your site first (see guide below), then click Refresh."
                    : "Connect Google first, or type manually: sc-domain:mysite.com or https://mysite.com/"}
                </p>
              </>
            )}
          </div>

          {/* GSC setup guide */}
          <div className="mt-4 rounded-lg border border-border-base bg-bg-secondary">
            <button
              type="button"
              onClick={() => setGuideOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-text-secondary"
            >
              <span>How to add your site to Search Console</span>
              {guideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {guideOpen && (
              <div className="border-t border-border-base px-3 pb-3 pt-2 text-xs leading-relaxed text-text-secondary">
                <ol className="space-y-2 list-decimal pl-4">
                  <li>
                    Open{" "}
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-accent-blue underline underline-offset-2"
                    >
                      Google Search Console <ExternalLink size={10} />
                    </a>{" "}
                    with the same Google account you connected here.
                  </li>
                  <li>
                    Click <strong>+ Add property</strong> (top-left dropdown).
                  </li>
                  <li>
                    Choose property type:
                    <ul className="mt-1 ml-3 space-y-1 list-disc">
                      <li>
                        <strong>Domain property</strong> (recommended) — covers all
                        protocols and subdomains. Requires adding a DNS TXT record in
                        your domain registrar. The GSC property string will be{" "}
                        <code className="rounded bg-bg-primary px-1">sc-domain:yourdomain.com</code>.
                      </li>
                      <li>
                        <strong>URL-prefix property</strong> — covers only one protocol
                        and subdomain. Easier to verify (HTML file or meta tag). The
                        property string is the full URL with trailing slash, e.g.{" "}
                        <code className="rounded bg-bg-primary px-1">https://yourdomain.com/</code>.
                      </li>
                    </ul>
                  </li>
                  <li>Complete the verification steps Google shows you.</li>
                  <li>
                    Come back here and click <strong>Refresh</strong> — your new
                    property will appear in the dropdown.
                  </li>
                </ol>
                <p className="mt-2 rounded bg-amber-500/10 px-2 py-1.5 text-amber-500">
                  <strong>Permission error?</strong> Your Google account must be{" "}
                  <strong>Owner</strong> or <strong>Full User</strong> on the property.
                  Go to Search Console &rarr; Settings &rarr; Users and permissions and
                  check your access level. Restricted users cannot access Search
                  Analytics data via the API.
                </p>
              </div>
            )}
          </div>

          {/* Client / someone else's site guide */}
          <div className="mt-3 rounded-lg border border-border-base bg-bg-secondary">
            <button
              type="button"
              onClick={() => setClientGuideOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-text-secondary"
            >
              <span>Tracking a client&apos;s / someone else&apos;s site</span>
              {clientGuideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {clientGuideOpen && (
              <div className="border-t border-border-base px-3 pb-3 pt-2 text-xs leading-relaxed text-text-secondary">
                <p>
                  You don&apos;t need the client&apos;s Google password or a second
                  account. You connect <strong>one</strong> Google account (yours),
                  and any property it can access appears here — even sites owned by
                  others. Just have the client grant your account access:
                </p>
                <ol className="mt-2 space-y-1.5 list-decimal pl-4">
                  <li>
                    The client opens{" "}
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-accent-blue underline underline-offset-2"
                    >
                      Search Console <ExternalLink size={10} />
                    </a>{" "}
                    and selects <strong>their</strong> property.
                  </li>
                  <li>
                    <strong>Settings</strong> &rarr; <strong>Users and permissions</strong>{" "}
                    &rarr; <strong>Add user</strong>.
                  </li>
                  <li>
                    They enter <strong>the Google email you connected here</strong>.
                  </li>
                  <li>
                    They set permission to <strong>Full</strong> (Restricted blocks the
                    API), then click <strong>Add</strong>.
                  </li>
                  <li>
                    Come back, click <strong>Refresh</strong> above — their site now
                    appears in the dropdown.
                  </li>
                </ol>
                <p className="mt-2 rounded bg-accent-blue/10 px-2 py-1.5 text-accent-blue">
                  Search Console access is per-property, so one Google login can track
                  many sites from many different owners.
                </p>
              </div>
            )}
          </div>

          <label className="mt-4 block text-sm font-medium text-text-secondary">
            Location
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
            >
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4">
            <span className="block text-sm font-medium text-text-secondary">
              Color (optional)
            </span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Pick color ${c}`}
                  onClick={() => setForm({ ...form, color: form.color === c ? "" : c })}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                    form.color === c ? "ring-2 ring-offset-2 ring-offset-bg-primary" : ""
                  }`}
                  style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
              {form.color ? (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, color: "" })}
                  className="text-xs text-text-muted hover:text-accent-red"
                >
                  clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-border-base px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
