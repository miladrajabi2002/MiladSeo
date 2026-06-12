"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center justify-center rounded-2xl border border-border-base bg-bg-card p-12 text-center shadow-card"
    >
      <AlertTriangle size={32} className="text-accent-yellow" />
      <h2 className="mt-3 text-lg font-semibold text-text-primary">
        Something went wrong
      </h2>
      <p className="mt-1 max-w-md text-sm text-text-secondary">
        {error.message || "An unexpected error occurred while loading this view."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <RotateCcw size={14} />
        Try again
      </button>
    </motion.div>
  );
}
