"use client";

interface GroupBadgeProps {
  group: string | null;
  className?: string;
}

interface GroupStyle {
  bg: string;
  text: string;
}

const GROUP_PALETTE: Record<string, GroupStyle> = {
  Airport: { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
  Homepage: { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7" },
  Daily: { bg: "rgba(20, 184, 166, 0.15)", text: "#14b8a6" },
  "Oman Route": { bg: "rgba(249, 115, 22, 0.15)", text: "#f97316" },
  "With Driver": { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899" },
  Toyota: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
  Sharjah: { bg: "rgba(99, 102, 241, 0.15)", text: "#6366f1" },
  Ajman: { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981" },
  "No Deposit": { bg: "rgba(234, 179, 8, 0.15)", text: "#ca8a04" },
};

const FALLBACK_COLORS: GroupStyle[] = [
  { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
  { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7" },
  { bg: "rgba(20, 184, 166, 0.15)", text: "#14b8a6" },
  { bg: "rgba(249, 115, 22, 0.15)", text: "#f97316" },
  { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899" },
  { bg: "rgba(99, 102, 241, 0.15)", text: "#6366f1" },
  { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function groupStyle(group: string): GroupStyle {
  return (
    GROUP_PALETTE[group] ??
    FALLBACK_COLORS[hashString(group) % FALLBACK_COLORS.length]
  );
}

export default function GroupBadge({ group, className = "" }: GroupBadgeProps) {
  if (!group) {
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-text-muted ${className}`}
        style={{ backgroundColor: "rgba(148, 163, 184, 0.15)" }}
      >
        —
      </span>
    );
  }

  const style = groupStyle(group);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {group}
    </span>
  );
}
