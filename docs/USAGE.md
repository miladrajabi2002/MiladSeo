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
- **Movers & Drops** — keywords that improved (left, green) or dropped
  (right, red) versus ~7 days ago.
- **Mobile** — average mobile position, counts of keywords that rank better
  or worse on mobile, a comparison table with the GAP column
  (mobile − desktop; green = mobile better), and a phone-mockup summary.
- **Alerts** — every move larger than 5 positions, with unread badge.

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

## 10. GSC data delay (important)

Search Console data lags real time by **2–3 days**. A sync today retrieves
data up to about the day before yesterday. This is normal Google behavior —
every rank tracker built on GSC has the same delay.
