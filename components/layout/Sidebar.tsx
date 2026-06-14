"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, Globe, LayoutDashboard, X } from "lucide-react";
import { apiGet } from "@/lib/client";
import type { ProjectSummary } from "@/lib/types";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      apiGet<ProjectSummary[]>("/api/projects")
        .then((data) => {
          if (!cancelled) setProjects(data);
        })
        .catch(() => {
          /* sidebar list is non-critical */
        });
    };
    load();
    window.addEventListener("projects-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("projects-changed", load);
    };
  }, [pathname]);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2" onClick={onCloseMobile}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue text-white">
            <BarChart3 size={18} />
          </span>
          <span className="text-base font-bold text-text-primary">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "SEO Dashboard"}
          </span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="rounded-lg p-1 text-text-muted hover:text-text-primary lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <Link
          href="/"
          onClick={onCloseMobile}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === "/"
              ? "bg-bg-secondary text-text-primary"
              : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          }`}
        >
          <LayoutDashboard size={16} />
          Projects
        </Link>

        <Link
          href="/guide"
          onClick={onCloseMobile}
          className={`mt-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === "/guide"
              ? "bg-bg-secondary text-text-primary"
              : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          }`}
        >
          <BookOpen size={16} />
          Guide
        </Link>

        <p className="mb-1 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Your sites
        </p>
        <div className="space-y-0.5">
          {projects.map((project, index) => {
            const active = activeId === String(project.id);
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                whileHover={{ x: 4 }}
              >
                <Link
                  href={`/project/${project.id}`}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-bg-secondary font-semibold text-text-primary"
                      : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                  }`}
                >
                  {project.color ? (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: project.color }}
                    />
                  ) : (
                    <Globe size={14} className="shrink-0" />
                  )}
                  <span className="truncate">{project.domain}</span>
                </Link>
              </motion.div>
            );
          })}
          {projects.length === 0 ? (
            <p className="px-3 py-2 text-xs text-text-muted">No projects yet</p>
          ) : null}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border-base bg-bg-card lg:block">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 w-64 border-r border-border-base bg-bg-card"
          >
            {content}
          </motion.aside>
        </div>
      ) : null}
    </>
  );
}
