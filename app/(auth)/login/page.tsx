"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, useAnimationControls } from "framer-motion";
import { BarChart3, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardControls = useAnimationControls();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setLoading(false);
    setError("Invalid email or password");
    void cardControls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45 },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-secondary p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue text-white">
            <BarChart3 size={24} />
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text-primary">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "SEO Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Keyword rank tracker · Google Search Console
          </p>
        </div>

        <motion.form
          animate={cardControls}
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-2xl border border-border-base bg-bg-card p-6 shadow-card"
        >
          <label className="block text-sm font-medium text-text-secondary">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue"
              placeholder="admin@example.com"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-text-secondary">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-base bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-accent-red"
            >
              {error}
            </motion.p>
          ) : null}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </motion.button>
        </motion.form>
      </motion.div>
    </main>
  );
}
