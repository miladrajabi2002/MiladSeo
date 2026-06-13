# Usage Guide

Everything you can do in the dashboard — every feature explained, plus a
recommended workflow for **what to do after you add a site** and **what to do
after an analysis**.

> **Persian version:** [USAGE.fa.md](USAGE.fa.md)

---

## Table of contents

1. [Login](#1-login)
2. [Connect Google](#2-connect-google)
3. [Add a project (site)](#3-add-a-project-site)
4. [First sync](#4-first-sync)
5. [Recommended workflow after adding a site](#5-recommended-workflow-after-adding-a-site)
6. [Feature reference — every tab](#6-feature-reference--every-tab)
7. [What to do after an analysis (action playbook)](#7-what-to-do-after-an-analysis-action-playbook)
8. [AI Audit — setup & usage](#8-ai-audit--setup--usage)
9. [Analytics (GA4) — setup & usage](#9-analytics-ga4--setup--usage)
10. [Core Web Vitals & PageSpeed keys](#10-core-web-vitals--pagespeed-keys)
11. [Reading position numbers](#11-reading-position-numbers)
12. [Keyword groups](#12-keyword-groups)
13. [Live Sheet, CSV & client sharing](#13-live-sheet-csv--client-sharing)
14. [GSC data delay (important)](#14-gsc-data-delay-important)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Login

Open the dashboard URL and sign in with `ADMIN_EMAIL` and the password you
hashed during setup. The session lasts 30 days (JWT — no database sessions).

## 2. Connect Google

Click **Connect Google** in the header and approve the read-only permissions:

- View Search Console data (rankings)
- See/create spreadsheets (the Live Sheet)
- Manage files created by this app (Drive)
- View Google Analytics data (the Analytics tab)

One Google account can read **many** sites — any property it has Owner/Full
access to shows up automatically, even sites owned by clients. When connected,
the header shows a green **"Google connected"** dot with an unplug icon to
disconnect (e.g. to switch accounts or re-grant a new permission).

> If you connected **before** the Analytics tab existed, disconnect and connect
> again once so the new read-only Analytics permission is granted.

## 3. Add a project (site)

Click **Add Project** and fill in:

- **Project name** — a friendly label, e.g. "Samin Rent".
- **Domain** — e.g. `samin-rent.ae` (used for display, the On-Page checker,
  CrUX, CSV/Sheet names).
- **GSC Property** — pick it from the dropdown (populated from your connected
  account; only properties you can query are eligible). Or type it manually:
  - Domain property: `sc-domain:samin-rent.ae`
  - URL-prefix property: `https://samin-rent.ae/` (trailing slash matters)
- **Location** — sets the country/language used for Keyword Research and shows
  as a badge (Iran, UAE, Saudi Arabia, …).

The dialog includes built-in guides for adding your site to Search Console and
for tracking a **client's** site (they just grant your Google email access).

## 4. First sync

Click **Sync Now** (project card or project header). The first sync:

- Queries Search Console day-by-day for the last 30 days,
- Creates a keyword for every query+page combination found,
- Stores desktop and mobile positions, clicks, impressions and CTR,
- Detects movers/drops and creates alerts.

A sync makes ~30 API calls and can take a minute or two. A second sync of the
same project is blocked while one is running. After the first sync, a daily
**4:00 AM** cron keeps data fresh automatically.

---

## 5. Recommended workflow after adding a site

Do these in order the first time you set up a site:

1. **Sync Now** and wait for it to finish (Overview fills with data).
2. **Overview** — get the lay of the land: average position, Top 3/10/20
   counts, the position distribution, and the visibility score.
3. **All Keywords** — sort by position. Identify keywords ranking **5–20** —
   these are your highest-opportunity terms (a small push reaches page 1).
   Assign **groups** (topic tags) so you can slice them later.
4. **Insights → CTR Opportunities** — find pages with many impressions but a
   low click rate; these need better titles/descriptions.
5. **Insights → Cannibalization** — find queries where two of your pages
   compete; pick one canonical page per query.
6. **Site Health** — check index coverage (are key pages indexed?), run
   PageSpeed on important pages, and review real-user Core Web Vitals (CrUX).
7. **On-Page** — run the checker on your most important pages (title, meta,
   H1, canonical, schema, broken links).
8. **Analytics** — link your GA4 property to see what visitors actually do
   (sessions, conversions) next to rankings.
9. **AI Audit** — connect a Claude/OpenAI key and run a full audit to get a
   prioritized to-do list in plain language.
10. **Annotations** — whenever you change something (rewrite titles, publish
    content, fix speed), log it with a date so you can see its effect later.

After setup, a good rhythm is: skim **Movers & Drops** and **Alerts** a couple
of times a week, and re-run the **AI Audit** every few weeks.

---

## 6. Feature reference — every tab

### Overview
Top 10/20/50 counts, average desktop position, total keywords, and a
distribution chart bucketing every keyword by position. Also includes:

- **Period comparison** — this week vs last week (or month vs month) across
  avg position, Top 3/10, clicks, impressions and CTR.
- **Visibility score** — one health number for the whole project. Each ranked
  keyword adds weight from a CTR curve (position 1 counts fully, position 50
  barely); 100 means every tracked keyword ranks #1. Watch the **trend**.
- **Annotations** — log dated notes ("rewrote homepage titles"). They appear
  as dashed markers on the visibility chart and every keyword trend chart.

### All Keywords
The full table. Search, filter by **group / position bucket / movement**, sort
any column, paginate (50/page). The TREND column shows the last 7 desktop
readings. Click any row for a **30/90-day trend chart** (desktop + mobile;
axis reversed so up = better). Hover a row and click the pencil to set its
**group**.

### Research (Keyword Research)
Type a seed keyword and get real **Google Autocomplete** suggestions
(free, no API key), localized to the project's country/language. Toggle
**All / Questions**, copy the whole list, and see a **tracked** badge on
queries you already monitor — perfect for finding content gaps.

### Pages
Per-URL performance: how many keywords each page ranks for, best/avg position,
clicks, impressions and a trend. Click a row to see the page's top keywords.

### Insights
- **Clicks & impressions** chart over time.
- **CTR Opportunities** — queries with lots of impressions but a CTR far below
  normal for their position → rewrite those titles/descriptions first.
- **Keyword Cannibalization** — queries where two or more of your pages
  compete with each other → consolidate to one page.

### Analytics (Google Analytics 4)
Link a GA4 property (picker populated from your Google account), then see
**sessions, users, new users, conversions, average session duration, bounce
rate**, a daily sessions/users trend, **traffic by channel**, and **top
landing pages**. Use the 7/28/90-day toggle. This shows what visitors *do*,
which GSC alone can't tell you. See [section 9](#9-analytics-ga4--setup--usage).

### Movers & Drops
Keywords that improved (left, green) or dropped (right, red) versus ~7 days
ago — spot wins and problems instantly.

### Mobile
Average mobile position, counts of keywords better/worse on mobile, a
comparison table with the **GAP** column (mobile − desktop; green = mobile
better), and a phone-mockup summary.

### Site Health
- **Index Coverage** (URL Inspection API) — is each page indexed? *Check stale
  batch* inspects the 25 oldest/never-checked pages; *Check* re-checks one.
  Quota is 2,000/day per property; results are cached.
- **PageSpeed** (Lighthouse via PageSpeed Insights) — lab performance score
  per page, mobile or desktop. 90+ green, 50–89 amber, <50 red.
- **Core Web Vitals — real users (CrUX)** — 28-day rolling **p75 LCP / INP /
  CLS** by week from real Chrome users, mobile or desktop. Green = good, amber
  = needs improvement, red = poor. Needs `PAGESPEED_API_KEY`
  (see [section 10](#10-core-web-vitals--pagespeed-keys)).

### On-Page
Fetch any URL (or leave blank for the homepage) and inspect:

- **Title** and **meta description** with length guidance,
- **H1/H2** structure (exactly one H1 is ideal),
- **canonical**, **robots meta** (warns on `noindex`), **viewport**, **lang**,
- **word count** (thin content < ~300 words), **images missing alt**,
- **Open Graph / Twitter** social tags,
- **JSON-LD schema** types and count,
- **redirect chain** (flags extra hops),
- **robots.txt** presence and **sitemap** discovery (with URL count),
- **broken links** — every link on the page is status-checked and the broken
  ones are listed. All free — it fetches the site directly.

### AI Audit
Connect a **Claude** or **OpenAI** key and run an expert audit. Returns a
**health score**, an executive **summary**, **prioritized recommendations**
(with category, priority, effort and impact), **quick wins** and **risks**.
See [section 8](#8-ai-audit--setup--usage).

### Alerts
Every keyword move larger than 5 positions, with an unread badge. After each
sync the app compares each keyword's desktop position to ~7 days earlier:

- 🟢 *Jumped 14 positions — was 54 → now 40.1*
- 🔴 *Dropped 17 positions — was 47 → now 63.5*

Click to mark read, or **Mark all as read**.

---

## 7. What to do after an analysis (action playbook)

The data points to specific actions. Use this mapping:

| What you see | What it means | What to do |
| --- | --- | --- |
| Keyword at position **5–20** | One page from #1 | Improve/expand that page's content; add the keyword to title/H1 |
| **CTR Opportunity** (high impressions, low CTR) | Title/description isn't attractive | Rewrite the title & meta description to be specific and compelling |
| **Cannibalization** group | Two pages compete for one query | Merge them, or differentiate intent and set one canonical |
| **Dropped** keyword in Movers/Alerts | A page lost ranking | Check the page for recent changes, indexing, content freshness |
| **CrUX poor / amber** (LCP/INP/CLS) | Real users get a slow/janky page | Optimize images, lazy-load, reduce JS, reserve image dimensions |
| **On-Page**: missing meta / multiple H1 / no schema | On-page basics are off | Fix the title/description, use a single H1, add JSON-LD schema |
| **On-Page**: broken links | Dead links hurt UX & crawl | Fix or remove the broken URLs |
| **Index Coverage** not PASS | Page may not be in Google | Check robots/canonical; request indexing; fix fetch errors |
| **Analytics**: high sessions, low conversions on a page | Traffic isn't converting | Improve the page's offer/CTA, match search intent |
| **AI Audit** recommendation | A prioritized expert suggestion | Work top-down: do **high** priority + **low** effort items first |

**Golden rule:** after any change, add an **Annotation** with today's date so a
week or two later you can see on the charts whether it helped.

---

## 8. AI Audit — setup & usage

1. Open a project → **AI Audit** tab.
2. Choose a **provider**:
   - **Claude (Anthropic)** — get a key at
     [console.anthropic.com](https://console.anthropic.com/settings/keys)
     (default model `claude-opus-4-8`).
   - **ChatGPT (OpenAI)** — get a key at
     [platform.openai.com](https://platform.openai.com/api-keys)
     (default model `gpt-4o`).
3. Optionally type a specific **model**; paste your **API key** and **Connect**.
   The key is verified with a tiny test call, **stored server-side only**, and
   never shown again.
4. Click **Run analysis**. The app sends a snapshot of this project's data
   (overview, traffic, CTR gaps, movers, cannibalization, top pages, Core Web
   Vitals) to the model and shows a structured audit.
5. Re-run any time after a new sync. Use **Change** to swap keys/provider, or
   the trash icon to remove the key.

> Cost is billed by your AI provider, not the dashboard. Audits are short
> (a few thousand tokens), so they're inexpensive.

## 9. Analytics (GA4) — setup & usage

1. Make sure your connected Google account can read the GA4 property and that
   the **Analytics read-only** scope was granted (reconnect Google once if you
   connected before this feature existed).
2. Open a project → **Analytics** tab → pick your property → **Link**.
3. Review **sessions, users, conversions, engagement, bounce**, the daily
   trend, **channels** and **top landing pages**. Switch 7/28/90 days.
4. **Unlink property** detaches it without affecting anything else.

GSC tells you how you rank; GA4 tells you what visitors do once they arrive —
together they show whether your SEO actually drives results.

## 10. Core Web Vitals & PageSpeed keys

- **PageSpeed** (Site Health) works with no key on a shared quota.
- **CrUX field data** (real-user Core Web Vitals) needs a free Google Cloud
  API key with the **Chrome UX Report API** enabled. Put it in `.env` as
  `PAGESPEED_API_KEY` (the same key also gives PageSpeed a dedicated quota).
- New sites may not have enough real-user data in CrUX yet — that's normal.

---

## 11. Reading position numbers

**Lower is better.** Position 1 is the top organic result. Values are GSC
averages, so decimals like 3.4 are normal.

| Position | Color |
| --- | --- |
| 1–3 | green |
| 4–10 | blue |
| 11–20 | amber |
| 21–50 | gray |
| 51+ | red |

Keywords ranked **5–20** are the highest-opportunity ones.

## 12. Keyword groups

Groups slice keywords by topic (Airport, Homepage, Toyota, …).

- In **All Keywords**, hover a row and click the pencil to set/change a group.
  The modal autocompletes existing group names and offers quick-pick chips so
  tags stay consistent.
- Filter the table by group from the **All Groups** dropdown.
- Group badges are color-coded consistently across the app.

## 13. Live Sheet, CSV & client sharing

- **● Live Sheet** — creates/refreshes a Google Sheet `{domain} - Rank Tracker`
  with three tabs (All Keywords, Movers & Drops, History). Re-clicking
  refreshes the same sheet (no duplicates).
- **↓ CSV** — downloads the current keyword table as `{domain}-keywords.csv`.
- **Share** — generates an unguessable read-only link (`/share/…`) showing
  stats, visibility, traffic and top movers — no login needed. **Revoke** kills
  it instantly; **Regenerate** issues a fresh URL. Treat the link like a
  password.

## 14. GSC data delay (important)

Search Console data lags real time by **2–3 days**. A sync today retrieves data
up to about the day before yesterday. This is normal Google behavior — every
GSC-based rank tracker has the same delay.

## 15. Troubleshooting

| Symptom | Fix |
| --- | --- |
| "User does not have sufficient permission" on sync | Your Google account is a *Restricted* user on the property — become Owner/Full in Search Console → Settings → Users and permissions |
| GSC property dropdown empty | Connect Google first, verify the site in Search Console, then click Refresh |
| Analytics tab: "No GA4 properties found" | Reconnect Google to grant the Analytics scope; ensure the account can read the property |
| CrUX: "Set PAGESPEED_API_KEY…" | Add a free Google Cloud key with the Chrome UX Report API enabled to `.env` |
| CrUX: "Not enough real-user data" | The site is too new/low-traffic for CrUX — try again later |
| AI Audit: "Could not connect" | Wrong/expired API key, or the model name isn't available on your account |
| "A sync is already running" | Wait for the current sync to finish (concurrent syncs are blocked) |
| On-Page can't fetch a URL | The site blocked the request or timed out — try the exact full URL |
