"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import GroupBadge from "@/components/ui/Badge";
import { apiPost, errorMessage } from "@/lib/client";
import type { AlertRow } from "@/lib/types";

interface AlertsListProps {
  alerts: AlertRow[];
  onChanged: () => void;
}

function describe(alert: AlertRow): string {
  const moved = Math.abs(Math.round(alert.delta));
  if (alert.type === "jumped") {
    return `Jumped ${moved} positions — was ${alert.prevPos} → now ${alert.nowPos}`;
  }
  return `Dropped ${moved} positions — was ${alert.prevPos} → now ${alert.nowPos}`;
}

export default function AlertsList({ alerts, onChanged }: AlertsListProps) {
  const markRead = async (alert: AlertRow) => {
    if (alert.isRead) return;
    try {
      await apiPost(`/api/alerts/${alert.id}/read`);
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-border-base bg-bg-card p-12 text-center shadow-card">
        <p className="text-2xl">🔔</p>
        <p className="mt-2 text-sm font-medium text-text-primary">No alerts</p>
        <p className="mt-1 text-xs text-text-muted">
          Alerts appear when a keyword moves more than 5 positions week-over-week.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert, index) => (
        <motion.li
          key={alert.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: alert.isRead ? 0.6 : 1, x: 0 }}
          transition={{
            duration: 0.3,
            delay: Math.min(index * 0.03, 0.5),
            ease: "easeOut",
          }}
          onClick={() => void markRead(alert)}
          className={`flex items-start gap-3 rounded-xl border border-border-base bg-bg-card p-4 shadow-card transition-colors ${
            alert.isRead ? "" : "cursor-pointer hover:bg-bg-secondary"
          }`}
        >
          <motion.span
            animate={{ opacity: alert.isRead ? 0.25 : 1 }}
            transition={{ duration: 0.4 }}
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              alert.type === "jumped" ? "bg-accent-green" : "bg-accent-red"
            } ${alert.isRead ? "" : "pulse-dot"}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-text-primary">{alert.keyword}</p>
              <GroupBadge group={alert.group} />
            </div>
            <p className="mt-0.5 text-sm text-text-secondary">{describe(alert)}</p>
          </div>
          <p className="shrink-0 text-xs text-text-muted">
            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
          </p>
        </motion.li>
      ))}
    </ul>
  );
}
