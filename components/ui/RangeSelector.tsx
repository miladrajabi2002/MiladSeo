"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export interface RangeOption {
  label: string;
  days: number;
}

const DEFAULT_OPTIONS: RangeOption[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "6m", days: 180 },
  { label: "1y", days: 365 },
];

interface RangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  options?: RangeOption[];
  /** show a small "custom days" input alongside the presets */
  allowCustom?: boolean;
}

/**
 * Compact segmented range picker (7d / 30d / 90d / 6m / 1y) with an optional
 * custom day count. Used to drive history windows across charts and tabs.
 */
export default function RangeSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  allowCustom = false,
}: RangeSelectorProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState(String(value));
  const isPreset = options.some((o) => o.days === value);

  const applyCustom = () => {
    const n = Number.parseInt(custom, 10);
    if (Number.isFinite(n) && n > 0) {
      onChange(Math.min(n, 480));
      setCustomOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-border-base p-0.5">
        {options.map((o) => (
          <button
            key={o.days}
            type="button"
            onClick={() => onChange(o.days)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              value === o.days
                ? "bg-accent-blue text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {o.label}
          </button>
        ))}
        {allowCustom ? (
          <button
            type="button"
            onClick={() => setCustomOpen((v) => !v)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              !isPreset
                ? "bg-accent-blue text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {!isPreset ? `${value}d` : "Custom"}
          </button>
        ) : null}
      </div>

      {allowCustom && customOpen ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={480}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom();
            }}
            className="w-16 rounded-lg border border-border-base bg-bg-primary px-2 py-1 text-xs text-text-primary outline-none focus:border-accent-blue"
            placeholder="days"
          />
          <button
            type="button"
            onClick={applyCustom}
            aria-label="Apply custom range"
            className="rounded-lg bg-accent-blue p-1.5 text-white transition-opacity hover:opacity-90"
          >
            <Check size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
