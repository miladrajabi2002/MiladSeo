"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Gauge, Lightbulb, List, Sparkles } from "lucide-react";

/** Fixed bottom navigation for the most-used project tabs (mobile only). */
export default function BottomNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/project/${projectId}`;

  const items = [
    { label: "Overview", href: base, icon: BarChart3 },
    { label: "Keywords", href: `${base}/keywords`, icon: List },
    { label: "Insights", href: `${base}/insights`, icon: Lightbulb },
    { label: "Health", href: `${base}/health`, icon: Gauge },
    { label: "AI", href: `${base}/ai`, icon: Sparkles },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border-base bg-bg-card/95 backdrop-blur lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              active ? "text-accent-blue" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
