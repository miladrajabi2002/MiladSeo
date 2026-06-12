"use client";

import { HelpCircle } from "lucide-react";

const ITEMS = [
  { range: "1–3", label: "Excellent — top of page one", color: "var(--pos-top3)" },
  { range: "4–10", label: "Page one", color: "var(--pos-top10)" },
  { range: "11–20", label: "Page two", color: "var(--pos-top20)" },
  { range: "21–50", label: "Needs work", color: "var(--pos-top50)" },
  { range: "50+", label: "Weak visibility", color: "var(--pos-beyond)" },
];

/** Hover/focus tip explaining what the position badge colors mean. */
export default function PositionLegend({
  align = "right",
}: {
  align?: "left" | "right";
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="What do the position colors mean?"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-base bg-bg-card text-text-muted transition-colors hover:text-accent-blue focus:text-accent-blue"
      >
        <HelpCircle size={15} />
      </button>
      <div
        className={`invisible absolute top-full z-30 mt-2 w-60 rounded-xl border border-border-base bg-bg-card p-3 opacity-0 shadow-card-hover transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Position color guide
        </p>
        <ul className="mt-2 space-y-1.5">
          {ITEMS.map((item) => (
            <li key={item.range} className="flex items-center gap-2 text-xs">
              <span
                className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md px-1.5 py-0.5 font-bold tabular-nums text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.range}
              </span>
              <span className="text-text-secondary">{item.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-border-base pt-2 text-[11px] leading-relaxed text-text-muted">
          Lower is better — the number is your average Google position.
        </p>
      </div>
    </div>
  );
}
