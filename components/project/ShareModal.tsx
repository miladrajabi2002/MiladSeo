"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { Check, Copy, Link2, ShieldOff } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { apiDelete, apiGet, apiPost, errorMessage } from "@/lib/client";
import type { ShareLinkInfo } from "@/lib/types";

interface ShareModalProps {
  projectId: number;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ projectId, open, onClose }: ShareModalProps) {
  const [link, setLink] = useState<ShareLinkInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoaded(false);
    apiGet<ShareLinkInfo | null>(`/api/projects/${projectId}/share`)
      .then((value) => {
        setLink(value);
        setLoaded(true);
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, [open, projectId]);

  const create = async () => {
    setWorking(true);
    try {
      const created = await apiPost<ShareLinkInfo>(
        `/api/projects/${projectId}/share`
      );
      setLink(created);
      toast.success(
        link ? "New link created — the old one is now revoked" : "Share link created"
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const revoke = async () => {
    setWorking(true);
    try {
      await apiDelete(`/api/projects/${projectId}/share`);
      setLink(null);
      toast.success("Share link revoked — the URL no longer works");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Public Dashboard Link">
      <p className="text-sm text-text-secondary">
        Anyone with this link can view a <strong>read-only</strong> dashboard
        of this project — no login needed. Perfect for sending to clients.
      </p>

      {!loaded ? (
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-bg-secondary" />
      ) : link ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-border-base bg-bg-secondary p-2">
            <Link2 size={14} className="shrink-0 text-accent-green" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary">
              {link.url}
            </span>
            <button
              type="button"
              onClick={() => void copy()}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-accent-blue px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Created {format(parseISO(link.createdAt), "MMM d, yyyy HH:mm")}
          </p>
          <div className="flex justify-between gap-2 border-t border-border-base pt-3">
            <button
              type="button"
              onClick={() => void revoke()}
              disabled={working}
              className="flex items-center gap-1.5 rounded-lg border border-accent-red/40 px-3 py-2 text-xs font-semibold text-accent-red transition-colors hover:bg-accent-red/10 disabled:opacity-50"
            >
              <ShieldOff size={13} />
              Revoke link
            </button>
            <button
              type="button"
              onClick={() => void create()}
              disabled={working}
              className="rounded-lg border border-border-base px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
            >
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => void create()}
            disabled={working}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Link2 size={14} />
            {working ? "Creating…" : "Create share link"}
          </button>
        </div>
      )}
    </Modal>
  );
}
