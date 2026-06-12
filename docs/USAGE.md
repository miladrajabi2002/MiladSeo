# Usage Guide

Everything you can do after installation.

## 1. Login

Open the dashboard URL and sign in with `ADMIN_EMAIL` and the password you
hashed during setup. The session lasts 30 days (JWT — no database sessions).

## 2. Add your first project

1. Click **Add Project** on the home page
2. Fill in:
   - **Project name** — a friendly label, e.g. "Samin Rent"
   - **Domain** — e.g. `samin-rent.ae` (used for display + CSV/Sheet names)
   - **GSC Property URL** — must match Search Console exactly:
     - Domain property: `sc-domain:samin-rent.ae`
     - URL-prefix property: `https://samin-rent.ae/` (trailing slash matters)
   - **Location** — informational badge (Iran, UAE, Saudi Arabia, …)

## 3. First sync

Click **Sync Now** (project card or project header). The first sync:

- Queries Search Console day-by-day for the last 30 days
- Creates a keyword for every query+page combination found
- Stores desktop and mobile positions, clicks, impressions and CTR
- Detects movers/drops and creates alerts

A sync makes ~30 API calls and can take a minute or two for large sites.
After the first sync, the daily 4:00 AM cron keeps data fresh automatically.

## 4. Understanding each tab

- **Overview** — Top 10/20/50 counts, average desktop position, total
  keywords, and a distribution chart bucketing all keywords by position.
- **All Keywords** — the full table. Search, filter by group / position
  bucket / movement, sort any column, paginate (50 per page). The TREND
  column shows the last 7 desktop readings as a mini bar chart.
- **Pages** — per-URL performance: how many keywords each page ranks for,
  best/avg position, clicks, impressions and a trend. Click a row to see
  the page's top keywords.
- **Insights** — clicks & impressions chart, **CTR Opportunities** (queries
  with lots of impressions but a CTR far below normal for their position —
  rewrite those titles/descriptions first) and **Keyword Cannibalization**
  (queries where two or more of your pages compete with each other).
- **Movers & Drops** — keywords that improved (left, green) or dropped
  (right, red) versus ~7 days ago.
- **Mobile** — average mobile position, counts of keywords that rank better
  or worse on mobile, a comparison table with the GAP column
  (mobile − desktop; green = mobile better), and a phone-mockup summary.
- **Site Health** — Google index coverage per page (URL Inspection API) and
  PageSpeed / Core Web Vitals scores per page.
- **Alerts** — every move larger than 5 positions, with unread badge.

### Keyword trend chart

Click any row in **All Keywords** to open a 30/90-day chart of its desktop
and mobile positions (the axis is reversed — up means better). Annotations
appear as dashed vertical lines so you can connect changes to movements.

### Period comparison

The **Overview** tab compares this week vs last week (or this month vs last
month) across avg position, Top 3/10 counts, clicks, impressions and CTR.

### Visibility score

A single health number for the whole project: every ranked keyword
contributes weight based on a click-through-rate curve (position 1 counts
fully, position 50 barely). 100 means every tracked keyword ranks #1.
Watch the trend, not the absolute value.

### Annotations

In **Overview → Annotations**, log changes like "rewrote homepage titles"
with a date. They appear as dashed markers on the visibility chart and on
every keyword trend chart — gold for figuring out *what caused* a movement.

## 5. How to read position numbers

**Lower is better.** Position 1 is the top organic result. Position values
are averages from GSC, so decimals like 3.4 are normal. Color coding:

| Position | Color |
| --- | --- |
| 1–3 | green |
| 4–10 | blue |
| 11–20 | amber |
| 21–50 | gray |
| 51+ | red |

## 6. Keyword groups

Groups let you slice keywords by topic (Airport, Homepage, Toyota, …).

- Hover a keyword row in **All Keywords** and click the pencil icon to assign
  or change its group.
- When bulk-adding keywords you can set a group for the whole batch.
- Group badges are color-coded consistently across the app.

## 7. Live Sheet

Click **● Live Sheet** in the project header. The app creates (first time) or
refreshes a Google Sheet named `{domain} - Rank Tracker` with three tabs:

1. **All Keywords** — current snapshot
2. **Movers & Drops** — improved and dropped lists
3. **History** — keywords × dates matrix of desktop positions

The sheet opens in a new tab and lives in the Google account you connected.
Each click refreshes the same sheet (it won't create duplicates).

## 8. CSV export

Click **↓ CSV** in the project header to download the current keywords table
as `{domain}-keywords.csv`.

## 9. When alerts appear

After every sync, the app compares each keyword's current desktop position to
~7 days earlier. Any move of **more than 5 positions** creates an alert:

- 🟢 *Jumped 14 positions — was 54 → now 40.1*
- 🔴 *Dropped 17 positions — was 47 → now 63.5*

Click an alert to mark it read, or use **Mark all as read**. The red badge on
the Alerts tab shows the unread count.

## 10. Site Health (index + speed)

**Index Coverage** uses Google's URL Inspection API:

- *Check stale batch* inspects the 25 pages with the oldest (or missing)
  results; the *Check* button re-checks a single page.
- Quota is **2,000 inspections/day per property** and Google requires the
  checks to run one at a time, so large sites take a few rounds.
- Results are cached in the database — re-open the tab anytime without
  spending quota.

**PageSpeed** runs Lighthouse via the free PageSpeed Insights API:

- Each audit takes **10–20 seconds**; run them per page, mobile or desktop.
- Score colors follow Lighthouse: 90+ green, 50–89 amber, <50 red.
- No API key needed; set `PAGESPEED_API_KEY` in `.env` if you hit the
  shared quota (the key is free in Google Cloud Console).

## 11. Public client dashboard

Click **Share** in the project header:

- **Create share link** generates an unguessable URL like
  `/share/Vx3k…` that shows a read-only report (stats, visibility,
  traffic, distribution, top movers) — no login needed. Send it to your
  client.
- **Revoke link** kills the URL instantly; **Regenerate** revokes the old
  one and issues a fresh URL.
- Treat the link like a password — anyone who has it can view the report
  until you revoke it.

## 12. GSC data delay (important)

Search Console data lags real time by **2–3 days**. A sync today retrieves
data up to about the day before yesterday. This is normal Google behavior —
every rank tracker built on GSC has the same delay.
