"use client";

import { Globe } from "lucide-react";

interface SiteAvatarProps {
  domain: string;
  size?: number;
  className?: string;
}

const GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #6366f1, #a855f7)",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Gradient tile with a globe icon; the gradient is derived from the domain
 * so each project keeps a stable, distinct color.
 */
export default function SiteAvatar({
  domain,
  size = 44,
  className = "",
}: SiteAvatarProps) {
  const cleaned = domain.replace(/^www\./, "");
  const gradient = GRADIENTS[hashString(cleaned) % GRADIENTS.length];

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-card ${className}`}
      style={{ width: size, height: size, background: gradient }}
    >
      {/* soft top highlight for depth */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 55%)",
        }}
      />
      <Globe size={Math.round(size * 0.48)} strokeWidth={1.9} />
    </span>
  );
}
