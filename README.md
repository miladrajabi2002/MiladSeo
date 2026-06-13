# SEO Dashboard — Personal Keyword Rank Tracker

A self-hosted dashboard for tracking keyword rankings across multiple sites,
powered by the **free Google Search Console API**. Single admin, multi-project,
dark/light theme, animated UI.

> **Persian version:** [README.fa.md](README.fa.md)

---

## What is this and why does it matter?

### SEO in one paragraph

When someone searches Google for "cheap flights to Kish", Google shows a list
of websites. **SEO (Search Engine Optimization)** is everything you do to appear
higher in that list. The higher you rank, the more clicks and visitors you get.
Your position in Google results is called your **rank** or **position** — position 1
is the very top, lower numbers are better.

### What is Google Search Console?

A **free tool by Google** that tells you how your site performs in Google search:

- Which keywords people searched to find your site
- What position your site holds for each keyword
- How many people saw your site (**Impressions**) and how many clicked (**Clicks**)

The problem: Search Console's own interface is raw and limited — it shows no
trend history, no alerts when rankings drop, and no way to compare multiple
sites side by side.

### What this dashboard does

Every day at 4 AM it automatically pulls 30 days of Search Console data,
stores it in a local database, and shows you:

| Tab | What it shows | Why it's useful |
|---|---|---|
| **Overview** | Average position, clicks, impressions, trend chart | At a glance: is my site improving or declining? |
| **Keywords** | Every keyword you rank for + position, clicks, 7-day change | Know which keywords you own and which need work |
| **Movers & Drops** | Keywords that moved up or down significantly | Spot wins and problems instantly |
| **Mobile** | Mobile vs desktop position comparison | Google prioritises mobile — catch gaps before they hurt |
| **Alerts** | Auto-alert when any keyword drops more than 5 positions | No need to check daily — it notifies you |

---

## Features

- **Overview** — Top 10 / Top 20 / Top 50 counts, average position, position distribution chart
- **Period comparison** — this week vs last week / this month vs last month across position, Top 3/10, clicks, impressions and CTR
- **Visibility score** — a single share-of-voice style health number with a 30/90-day trend chart
- **Annotations** — log site changes on a timeline and see them as markers on every chart
- **All Keywords** — sortable, filterable table with desktop/mobile positions, 7-day change, sparkline trends
- **Per-keyword trend chart** — click any keyword for a 30/90-day desktop + mobile position chart
- **Pages view** — per-URL performance: keyword count, best/avg position, clicks, trend
- **Insights** — clicks/impressions chart, CTR opportunities (high impressions + low CTR = fix the title/description) and keyword cannibalization detection
- **Movers & Drops** — week-over-week improved and dropped keywords
- **Mobile** — mobile vs desktop comparison with gap column
- **Site Health** — Google index coverage per page (URL Inspection API) + PageSpeed / Core Web Vitals scores + real-user Core Web Vitals history (Chrome UX Report)
- **AI Audit** — connect a Claude or OpenAI API key and get an expert SEO audit: health score, prioritized recommendations, quick wins and risks
- **Analytics** — link a Google Analytics 4 property to see sessions, users, conversions, channels and top landing pages next to your rankings
- **On-Page checker** — inspect any URL's title, meta, headings, canonical, robots, Open Graph, schema, redirects, robots.txt, sitemap and broken links
- **Keyword Research** — expand a seed keyword into real Google Autocomplete suggestions, localized to the project
- **Public client dashboard** — shareable read-only report link, revocable anytime
- **Alerts** — automatic alerts when a keyword moves more than 5 positions
- **Live Sheet** — one-click export to a Google Sheet (keywords, movers, full history)
- **CSV export**
- **Daily auto-sync** at 4:00 AM via built-in cron
- Dark/light theme (system-aware), fully animated with Framer Motion
- Multi-project — track as many sites as you want

---

## Tech Stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS + CSS variables theming
- Framer Motion, Recharts, Lucide icons
- SQLite via Prisma ORM
- NextAuth.js (single-admin credentials)
- googleapis (Search Console + Sheets)
- node-cron inside a custom Next.js server

---

## Getting started

### Prerequisites

- Node.js 20 LTS
- A site **verified** in Google Search Console (see [Step 1](#step-1--add-your-site-to-search-console) below)
- A Google Cloud project with OAuth credentials (see [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md))

### Quick start (local dev)

```bash
cp .env.example .env          # fill in required values
make install                  # npm install + prisma generate
npx prisma migrate dev        # create the SQLite database
make hash-password PASSWORD=YourPassword123   # paste output into .env
make dev                      # open http://localhost:3000
```

Want sample data without connecting Google? `npx prisma db seed`

### Production (Ubuntu + PM2 + Nginx + SSL)

Follow the full guide: [docs/INSTALLATION.md](docs/INSTALLATION.md)

---

## Step-by-step: from zero to first sync

### Step 1 — Add your site to Search Console

Before syncing, your site must be **verified** in Search Console under the same
Google account you will connect to the dashboard.

**Option A — Domain property (recommended)**

Covers all subdomains and both http/https. The property string in the dashboard
will be `sc-domain:yourdomain.com`.

1. Open [search.google.com/search-console](https://search.google.com/search-console)
2. Top-left dropdown → **Add property**
3. Choose **Domain**, enter `yourdomain.com` → **Continue**
4. Google gives you a DNS TXT record, e.g. `google-site-verification=XXXXX`
5. Log in to your domain registrar (Cloudflare, Namecheap, etc.) and add a
   new **TXT record** with that value
6. Back in Search Console → **Verify** (usually instant on Cloudflare,
   up to a few hours on other registrars)

**Option B — URL-prefix property**

Covers only the exact URL you register. Easier to verify (HTML file or meta tag).
The property string will be `https://yourdomain.com/` (trailing slash required).

### Step 2 — Check your permission level

The Search Analytics API requires **Owner** or **Full User** access.
**Restricted User** access lets you view data in the GSC web UI but blocks
the API — you will see the error:
```
User does not have sufficient permission for site '...'
```

To check: Search Console → select the property → **Settings** → **Users and permissions**.

| Level | API access | How you get it |
|---|---|---|
| **Owner** | Yes | You verified the property yourself |
| **Full User** | Yes | Explicitly added at this level by an owner |
| **Restricted User** | **No** | Default when added without specifying level |

To upgrade: click the three-dot menu next to your email → **Change permission** → **Full**.

### Adding a client's or someone else's site

You do **not** need the client's Google password, and you do **not** need a
separate Google account. The dashboard connects with **one** Google account
(yours), and any property that account can access shows up automatically — even
if the site is owned by someone else.

So to track a client's site, the client simply grants your Google account access
to their existing Search Console property:

1. The client opens [Search Console](https://search.google.com/search-console)
   and selects **their** property.
2. **Settings** → **Users and permissions** → **Add user**.
3. They enter **the Google email you connected to this dashboard**.
4. They set the permission level to **Full** (recommended) so the API works.
   *Restricted* lets them see data in the GSC web UI but blocks the API.
5. Click **Add**.

That's it — no code changes, no extra login. Back in the dashboard click
**Refresh** in the Add Project dialog and the client's site appears in the
property dropdown, ready to add as a new project.

> **Why one account works for many sites:** Search Console permissions are
> per-property, not per-account. One Google login can hold Owner/Full access to
> dozens of different sites owned by different people. The dashboard currently
> stores a single Google connection, so every project is read through that one
> authorized account.

### Step 3 — Set up Google Cloud OAuth

Follow [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md) to create OAuth credentials
and fill in the four `GOOGLE_*` variables in `.env`.

### Step 4 — Connect Google in the dashboard

1. Log in to the dashboard
2. Click **Connect Google** in the header
3. Sign in with the same Google account that has access to your Search Console
   properties
4. Approve the permissions (read Search Console data + create/edit Sheets)

### Step 5 — Add a project

1. Click **Add Project** on the home page
2. Fill in the name and domain
3. The **GSC Property** field shows a dropdown populated from your connected
   account — only properties with Owner or Full User access are listed
4. Select the property and click **Create Project**

### Step 6 — Sync

Click **Sync Now** on the project card. The first sync pulls 30 days of data
(~30 API calls, may take a minute or two). After that, the 4 AM cron keeps
everything up to date automatically.

---

## Understanding the data

### Lower position = better

Position 1 is the top organic result. GSC returns averages, so decimals like
3.4 are normal.

| Position | Colour |
|---|---|
| 1–3 | Green |
| 4–10 | Blue |
| 11–20 | Amber |
| 21–50 | Gray |
| 51+ | Red |

### GSC data delay

Search Console data has a **2–3 day lag**. A sync today retrieves data up to
roughly the day before yesterday. This is normal Google behaviour — every rank
tracker built on GSC has the same delay.

### Keywords worth focusing on

Keywords ranked **5–20** are the highest-opportunity ones: a small content
improvement can move them to page one and multiply your clicks.

---

## Documentation

| File | Contents |
|---|---|
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Full Ubuntu 22.04 production setup (PM2, Nginx, SSL) |
| [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md) | Google Cloud / OAuth + Search Console permissions |
| [docs/USAGE.md](docs/USAGE.md) | Every feature explained + post-setup & post-analysis workflow (English) |
| [docs/USAGE.fa.md](docs/USAGE.fa.md) | همان راهنمای کامل استفاده به فارسی |
| [docs/API.md](docs/API.md) | Every API endpoint with request/response examples |
