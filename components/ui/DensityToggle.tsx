"use client";

import { AlignJustify, Menu, Rows3 } from "lucide-react";
import { useDensity, type Density } from "@/contexts/DensityContext";

const OPTIONS: { key: Density; label: string; icon: typeof Rows3 }[] = [
  { key: "compact", label: "Compact", icon: Rows3 },
  { key: "comfortable", label: "Comfortable", icon: Menu },
  { key: "spacious", label: "Spacious", icon: AlignJustify },
];

/** Cycles table density: compact → comfortable → spacious. */
export default function DensityToggle() {
  const { density, setDensity } = useDensity();
  const idx = OPTIONS.findIndex((o) => o.key === density);
  const current = OPTIONS[idx] ?? OPTIONS[1];
  const Icon = current.icon;

  return (
    <button
      type="button"
      aria-label={`Table density: ${current.label}`}
      title={`Density: ${current.label} (click to change)`}
      onClick={() => setDensity(OPTIONS[(idx + 1) % OPTIONS.length].key)}
      className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border-base bg-bg-card text-text-secondary transition-colors hover:text-text-primary sm:flex"
    >
      <Icon size={16} />
    </button>
  );
}
