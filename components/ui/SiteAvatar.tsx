"use client";

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
 * Monogram tile: the site's initial on a gradient derived from the domain,
 * so every project gets a stable, distinct identity — no network fetches,
 * no generic globe.
 */
export default function SiteAvatar({
  domain,
  size = 44,
  className = "",
}: SiteAvatarProps) {
  const cleaned = domain.replace(/^www\./, "");
  const gradient = GRADIENTS[hashString(cleaned) % GRADIENTS.length];
  const initial = (cleaned[0] ?? "?").toUpperCase();

  return (
    <span
      className={`relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-xl text-white shadow-card ${className}`}
      style={{ width: size, height: size, background: gradient }}
    >
      {/* soft top highlight for depth */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 55%)",
        }}
      />
      <span
        className="font-extrabold leading-none tracking-tight"
        style={{
          fontSize: Math.round(size * 0.46),
          textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      >
        {initial}
      </span>
      {/* tiny accent dot — echoes the "live tracking" identity of the app */}
      <span
        className="absolute rounded-full bg-white/85"
        style={{
          width: Math.max(3, Math.round(size * 0.09)),
          height: Math.max(3, Math.round(size * 0.09)),
          right: Math.round(size * 0.14),
          bottom: Math.round(size * 0.14),
        }}
      />
    </span>
  );
}
