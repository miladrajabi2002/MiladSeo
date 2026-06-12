"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import GroupBadge from "@/components/ui/Badge";
import PositionBadge from "@/components/ui/PositionBadge";
import type { MobileData } from "@/lib/types";

interface MobilePhoneMockupProps {
  data: MobileData;
  location: string;
}

export default function MobilePhoneMockup({
  data,
  location,
}: MobilePhoneMockupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
      className="mx-auto w-full max-w-[320px]"
    >
      <div className="rounded-[2.2rem] border-[6px] border-border-base bg-bg-card p-4 shadow-card-hover">
        {/* Notch */}
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-border-base" />

        <div className="text-center">
          <h3 className="text-sm font-bold text-text-primary">Mobile Rankings</h3>
          <p className="text-xs text-text-muted">
            {location} · {format(new Date(), "MMM d, yyyy")}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-bg-secondary p-3 text-center">
            <p className="text-xl font-bold tabular-nums text-accent-green">
              {data.top10Mobile}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Top 10 Mobile · {location}
            </p>
          </div>
          <div className="rounded-xl bg-bg-secondary p-3 text-center">
            <p className="text-xl font-bold tabular-nums text-accent-blue">
              {data.avgMobile === null ? "–" : data.avgMobile.toFixed(1)}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Avg Pos
            </p>
          </div>
        </div>

        <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Top Mobile Keywords
        </p>
        <ul className="mt-2 space-y-1.5">
          {data.topMobile.map((row, index) => (
            <motion.li
              key={row.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.3 + index * 0.05,
                ease: "easeOut",
              }}
              className="flex items-center justify-between gap-2 rounded-lg bg-bg-secondary px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-text-primary">
                  {row.text}
                </p>
                <GroupBadge group={row.group} className="mt-0.5 scale-90 origin-left" />
              </div>
              <PositionBadge position={row.mobilePos} />
            </motion.li>
          ))}
          {data.topMobile.length === 0 ? (
            <li className="py-6 text-center text-xs text-text-muted">
              No mobile data yet
            </li>
          ) : null}
        </ul>

        {/* Home indicator */}
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-border-base" />
      </div>
    </motion.div>
  );
}
