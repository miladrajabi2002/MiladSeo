"use client";

import { useState } from "react";
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
 * Shows the site's real favicon when reachable; otherwise falls back to a
 * gradient globe tile derived from the domain so each project keeps a
 * stable, distinct color.
 */
export default function SiteAvatar({
  domain,
  size = 44,
  className = "",
}: SiteAvatarProps) {
  const [failed, setFailed] = useState(false);
  const cleaned = domain.replace(/^www\./, "");
  const gradient = GRADIENTS[hashString(cleaned) % GRADIENTS.length];

  if (failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl text-white shadow-card ${className}`}
        style={{ width: size, height: size, background: gradient }}
      >
        <Globe size={Math.round(size * 0.5)} strokeWidth={1.8} />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-base bg-bg-card shadow-card ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleaned)}&sz=64`}
        alt={cleaned}
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        className="rounded-md"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
