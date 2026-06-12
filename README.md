# SEO Dashboard — Personal Keyword Rank Tracker

A complete, self-hosted SEO dashboard for tracking keyword rankings across
multiple sites, powered by the **free Google Search Console API**. Single
admin, multi-project, dark/light theme, animated UI.

![Dashboard screenshot placeholder](docs/screenshots/dashboard.png)
![Keywords table screenshot placeholder](docs/screenshots/keywords.png)

## Features

- 📊 **Overview** — Top 10 / Top 20 / Top 50 counts, average position, position distribution chart
- 🔑 **All Keywords** — sortable, filterable table with desktop/mobile positions, 7-day change, sparkline trends
- 🚀 **Movers & Drops** — week-over-week improved and dropped keywords
- 📱 **Mobile** — mobile vs desktop comparison with a phone-mockup summary card
- 🔔 **Alerts** — automatic alerts when a keyword moves more than 5 positions
- 📄 **Live Sheet** — one-click export to a Google Sheet (keywords, movers, full history)
- ⬇️ **CSV export**
- ⏰ **Daily auto-sync** at 4:00 AM via built-in cron
- 🌙 Dark/light theme (system-aware), fully animated with Framer Motion

## Tech Stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS + CSS variables theming
- Framer Motion, Recharts, Lucide icons
- SQLite via Prisma ORM
- NextAuth.js (single-admin credentials)
- googleapis (Search Console + Sheets)
- node-cron inside a custom Next.js server

## Prerequisites

- Node.js 18.17+ (20 LTS recommended)
- A site verified in [Google Search Console](https://search.google.com/search-console)
- A Google Cloud project with OAuth credentials (see [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md))

## Quick Start

```bash
cp .env.example .env          # then fill in the values
make install                  # npm install + prisma generate
npx prisma migrate dev        # create the SQLite database
make hash-password PASSWORD=YourPassword123   # paste output into .env
make dev                      # http://localhost:3000
```

Want demo data without connecting Google? Run `npx prisma db seed`.

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Full Ubuntu 22.04 production setup (PM2, Nginx, SSL) |
| [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md) | Google Cloud / OAuth step-by-step |
| [docs/USAGE.md](docs/USAGE.md) | How to use every feature |
| [docs/API.md](docs/API.md) | Every API endpoint with examples |

## Note on GSC data delay

Google Search Console data has a 2–3 day delay. The newest dates returned by
a sync will always lag today by a couple of days — this is normal Google
behavior, not a bug.
