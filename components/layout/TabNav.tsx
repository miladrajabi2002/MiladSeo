"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export interface TabItem {
  label: string;
  href: string;
  badge?: number;
}

export default function TabNav({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-border-base px-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            ) : null}
            {active ? (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-blue"
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
