"use client";

import { motion } from "framer-motion";
import type { DistributionBucket } from "@/lib/types";

/**
 * Compact stacked "visibility bar" showing how a project's keywords are
 * distributed across position buckets. Each segment is sized by its share
 * and animates its width on mount.
 */
export default function MiniDistribution({
  distribution,
}: {
  distribution: DistributionBucket[];
}) {
  const total = distribution.reduce((sum, b) => sum + b.count, 0);

  if (total === 0) {
    return (
      <div className="h-2 w-full rounded-full bg-bg-secondary" />
    );
  }

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
      {distribution.map((bucket) => {
        const pct = (bucket.count / total) * 100;
        if (pct === 0) return null;
        return (
          <motion.div
            key={bucket.bucket}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ backgroundColor: bucket.color }}
            title={`${bucket.bucket}: ${bucket.count}`}
          />
        );
      })}
    </div>
  );
}
