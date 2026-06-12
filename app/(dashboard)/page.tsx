"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FolderPlus, Plus, RefreshCw } from "lucide-react";
import ProjectCard from "@/components/dashboard/ProjectCard";
import Modal from "@/components/ui/Modal";
import { CardGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiGet, apiPost, errorMessage } from "@/lib/client";
import type { ProjectSummary } from "@/lib/types";

const LOCATIONS = ["Iran", "UAE", "Saudi Arabia", "Egypt", "UK", "USA", "Other"];

interface GscSite {
  siteUrl: string | null | undefined;
  permissionLevel: string | null | undefined;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    domain: "",
    gscProperty: "",
    location: "Iran",
  });
  const [submitting, setSubmitting] = useState(false);
  const [gscSites, setGscSites] = useState<GscSite[] | null>(null);
  const [loadingSites, setLoadingSites] = useState(false);

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
    fetchGscSites();
  }, [fetchGscSites]);

  useEffect(() => {
    load();
    // Surface Google OAuth callback result
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
      setForm({ name: "", domain: "", gscProperty: "", location: "Iran" });
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
              Connect a domain that is verified in Google Search Console and
              start tracking its keyword rankings.
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

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setGscSites(null); }} title="Add Project">
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
            {gscSites && gscSites.length > 0 ? (
              <>
                <select
                  required
                  value={form.gscProperty}
                  onChange={(e) => setForm({ ...form, gscProperty: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— pick a property —</option>
                  {gscSites.map((s) => (
                    <option key={s.siteUrl ?? ""} value={s.siteUrl ?? ""}>
                      {s.siteUrl}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-text-muted">
                  Properties fetched from your connected Google account.
                </span>
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
                <span className="mt-1 block text-xs font-normal text-text-muted">
                  {loadingSites
                    ? "Fetching your Search Console properties…"
                    : gscSites
                    ? "No properties found — enter manually (sc-domain:mysite.com or https://mysite.com/)."
                    : "Connect Google first or enter manually (sc-domain:mysite.com or https://mysite.com/)."}
                </span>
              </>
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
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setGscSites(null); }}
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
