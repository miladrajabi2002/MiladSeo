import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card": "var(--bg-card)",
        "border-base": "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "accent-blue": "var(--accent-blue)",
        "accent-green": "var(--accent-green)",
        "accent-red": "var(--accent-red)",
        "accent-yellow": "var(--accent-yellow)",
        "pos-top3": "var(--pos-top3)",
        "pos-top10": "var(--pos-top10)",
        "pos-top20": "var(--pos-top20)",
        "pos-top50": "var(--pos-top50)",
        "pos-beyond": "var(--pos-beyond)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover":
          "0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
