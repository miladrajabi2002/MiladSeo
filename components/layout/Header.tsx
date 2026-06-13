"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Menu, PlugZap } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import CalendarToggle from "@/components/ui/CalendarToggle";
import { apiGet } from "@/lib/client";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

interface GoogleStatus {
  connected: boolean;
  configured: boolean;
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  const [google, setGoogle] = useState<GoogleStatus | null>(null);

  useEffect(() => {
    apiGet<GoogleStatus>("/api/settings/google")
      .then(setGoogle)
      .catch(() => setGoogle(null));
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-base bg-bg-card/80 px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onOpenMobileMenu}
        className="rounded-lg p-2 text-text-secondary hover:text-text-primary lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        {google && !google.connected ? (
          <a
            href="/api/auth/google"
            className="flex items-center gap-1.5 rounded-lg border border-border-base px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            title={
              google.configured
                ? "Authorize Google Search Console access"
                : "Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env first"
            }
          >
            <PlugZap size={14} className="text-accent-yellow" />
            Connect Google
          </a>
        ) : null}
        {google?.connected ? (
          <span className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-text-muted">
            <span className="pulse-dot h-2 w-2 rounded-full bg-accent-green" />
            Google connected
          </span>
        ) : null}
        <CalendarToggle />
        <ThemeToggle />
        <button
          type="button"
          aria-label="Sign out"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-base bg-bg-card text-text-secondary transition-colors hover:text-accent-red"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
