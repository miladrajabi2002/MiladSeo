# API Reference

All endpoints live under `/api`. Every endpoint except the auth routes
requires a valid NextAuth session cookie (the browser gets one at login;
API requests without it receive `401`).

**Response format** (consistent across all endpoints):

```jsonc
// Success
{ "data": <payload> }

// Error
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

**Error codes**

| Code | HTTP | Meaning |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Not signed in |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Bad request body/params |
| `INVALID_ID` | 422 | Non-numeric id in the path |
| `SYNC_FAILED` | 500 | GSC sync error (message has details) |
| `SHEET_FAILED` | 500 | Google Sheets error |
| `INTERNAL_ERROR` | 500 | Anything else |

---

## Auth

### `GET/POST /api/auth/[...nextauth]`
NextAuth credentials flow. Sign in by POSTing to
`/api/auth/callback/credentials` (handled by the login page — you normally
never call this manually).

### `GET /api/auth/google`
Auth required. Redirects (302) to Google's OAuth consent screen requesting
`webmasters.readonly`, `spreadsheets` and `drive.file` scopes.

### `GET /api/auth/google/callback`
Google redirects here with `?code=`. Exchanges the code, stores the refresh
token in the database, then redirects to `/?google=connected` (or
`/?google=error`).

### `GET /api/settings/google`
Reports Google connection status.

```json
{ "data": { "connected": true, "configured": true } }
```

---

## Projects

### `GET /api/projects`
List all projects with computed stats.

```json
{
  "data": [
    {
      "id": 1,
      "name": "Samin Rent",
      "domain": "samin-rent.ae",
      "gscProperty": "sc-domain:samin-rent.ae",
      "location": "UAE",
      "keywordCount": 124,
      "avgPosition": 23.7,
      "lastSyncAt": "2026-06-12T04:00:11.000Z",
      "createdAt": "2026-05-01T09:30:00.000Z"
    }
  ]
}
```

### `POST /api/projects`
Create a project.

Request:

```json
{
  "name": "Samin Rent",
  "domain": "samin-rent.ae",
  "gscProperty": "sc-domain:samin-rent.ae",
  "location": "UAE"
}
```

`location` must be one of: `Iran`, `UAE`, `Saudi Arabia`, `Egypt`, `UK`,
`USA`, `Other` (defaults to `Iran`). Returns `201` with the created project.

### `GET /api/projects/:id`
Single project with counts.

```json
{
  "data": {
    "id": 1,
    "name": "Samin Rent",
    "domain": "samin-rent.ae",
    "gscProperty": "sc-domain:samin-rent.ae",
    "location": "UAE",
    "lastSyncAt": "2026-06-12T04:00:11.000Z",
    "createdAt": "2026-05-01T09:30:00.000Z",
    "keywordCount": 124,
    "unreadAlerts": 3
  }
}
```

### `DELETE /api/projects/:id`
Deletes the project and (via cascade) all keywords, rankings and alerts.
Returns `{ "data": { "deleted": true } }`.

---

## Project data

### `GET /api/projects/:id/overview`

```json
{
  "data": {
    "top10": 18,
    "top20": 25,
    "top50": 41,
    "avgDesktop": 27.4,
    "totalKeywords": 124,
    "distribution": [
      { "bucket": "1-3", "count": 6, "color": "var(--pos-top3)" },
      { "bucket": "4-10", "count": 12, "color": "var(--pos-top10)" },
      { "bucket": "11-20", "count": 25, "color": "var(--pos-top20)" },
      { "bucket": "21-50", "count": 41, "color": "var(--pos-top50)" },
      { "bucket": "51-100", "count": 30, "color": "var(--pos-beyond)" },
      { "bucket": "100+", "count": 10, "color": "var(--text-muted)" }
    ]
  }
}
```

### `GET /api/projects/:id/keywords`
Full keyword table. `change` is `prevPos - nowPos` (positive = improved).
`trend` is the last ≤7 desktop positions, oldest first.

```json
{
  "data": [
    {
      "id": 17,
      "text": "rent a car dubai airport",
      "urlPath": "/dubai-airport",
      "group": "Airport",
      "desktopPos": 6.2,
      "mobilePos": 7.9,
      "change": 1.4,
      "trend": [8.1, 7.7, 7.5, 7.0, 6.8, 6.5, 6.2],
      "clicks": 42,
      "impressions": 510
    }
  ]
}
```

**CSV export:** `GET /api/projects/:id/keywords?format=csv` returns
`text/csv` with a `Content-Disposition: attachment` header.

### `POST /api/projects/:id/keywords`
Add one keyword: `{ "text": "...", "urlPath": "/page", "group": "Airport" }`
(`urlPath`/`group` optional). Returns `201`.

### `PATCH /api/projects/:id/keywords`
Update a keyword's group and/or urlPath:

```json
{ "keywordId": 17, "group": "Airport" }
```

Send an empty string to clear a field.

### `DELETE /api/projects/:id/keywords?keywordId=17`
Removes the keyword and its ranking history.

### `POST /api/projects/:id/keywords/bulk`
Add many keywords; duplicates (same text) are skipped.

```json
{ "keywords": ["rent a car dubai", "car hire sharjah"], "group": "Homepage" }
```

Response: `{ "data": { "created": 2, "skipped": 0 } }`

### `GET /api/projects/:id/movers`

```json
{
  "data": {
    "improved": [
      {
        "id": 17,
        "text": "zero deposit rent a car uae",
        "group": "No Deposit",
        "prevPos": 54.0,
        "nowPos": 40.1,
        "delta": 13.9,
        "trend": [54, 50.2, 47.8, 45, 43.1, 41, 40.1]
      }
    ],
    "dropped": [
      {
        "id": 22,
        "text": "toyota yaris rental price dubai",
        "group": "Toyota",
        "prevPos": 31.0,
        "nowPos": 38.5,
        "delta": -7.5,
        "trend": [31, 32.4, 33.8, 35.1, 36.6, 37.7, 38.5]
      }
    ]
  }
}
```

### `GET /api/projects/:id/mobile`

```json
{
  "data": {
    "avgMobile": 36.1,
    "betterOnMobile": 14,
    "worseOnMobile": 9,
    "top10Mobile": 10,
    "rows": [
      {
        "id": 17,
        "text": "rent a car dubai airport",
        "group": "Airport",
        "mobilePos": 7.9,
        "desktopPos": 6.2,
        "gap": 1.7
      }
    ],
    "topMobile": [
      { "id": 17, "text": "rent a car dubai airport", "group": "Airport", "mobilePos": 7.9 }
    ]
  }
}
```

`gap` = mobile − desktop. Negative gap means mobile ranks better.

### `GET /api/projects/:id/alerts?filter=jumped|dropped|unread`
Newest first, max 200. Omit `filter` for all.

```json
{
  "data": [
    {
      "id": 3,
      "projectId": 1,
      "keyword": "ajman car hire weekly",
      "type": "jumped",
      "group": "Ajman",
      "prevPos": 54,
      "nowPos": 40.1,
      "delta": 13.9,
      "isRead": false,
      "createdAt": "2026-06-10T08:00:00.000Z"
    }
  ]
}
```

### `PUT /api/projects/:id/alerts`
Marks all the project's alerts as read.
Response: `{ "data": { "updated": 5 } }`

### `POST /api/alerts/:id/read`
Marks one alert as read. Returns the updated alert.

---

## Sync & Export

### `POST /api/projects/:id/sync`
Triggers a manual Search Console sync (last 30 days, day-by-day,
`query`+`page`+`device` dimensions). Can take 1–2 minutes.

```json
{ "data": { "keywordsTouched": 124, "rankingsWritten": 5210, "alertsCreated": 2 } }
```

Fails with `SYNC_FAILED` if Google isn't connected or the GSC property is
inaccessible.

### `POST /api/projects/:id/live-sheet`
Creates (first call) or refreshes the project's Google Sheet and returns its
URL.

```json
{ "data": { "url": "https://docs.google.com/spreadsheets/d/1AbC..." } }
```

---

## Analytics & Insights

### `GET /api/projects/:id/keywords/:keywordId/history?days=30|90`
Daily ranking history for one keyword (powers the trend modal). `days`
defaults to 30; only `90` is accepted as an alternative.

```jsonc
{
  "data": {
    "id": 17,
    "text": "rent a car dubai",
    "urlPath": "/rent",
    "group": "Airport",
    "points": [
      { "date": "2026-06-01", "desktopPos": 8.2, "mobilePos": 9.1, "clicks": 4, "impressions": 310 }
    ],
    "annotations": [{ "id": 1, "date": "2026-06-03", "title": "New titles", "note": null }]
  }
}
```

### `GET /api/projects/:id/compare?range=week|month`
Aggregates for the current period vs the previous one (avg position, Top 3,
Top 10, clicks, impressions, CTR).

```jsonc
{
  "data": {
    "range": "week",
    "current":  { "label": "This week", "avgPosition": 14.2, "top3": 6, "top10": 21, "clicks": 412, "impressions": 18250, "ctr": 2.3 },
    "previous": { "label": "Last week", "avgPosition": 15.0, "top3": 5, "top10": 19, "clicks": 388, "impressions": 17020, "ctr": 2.3 }
  }
}
```

### `GET /api/projects/:id/traffic?days=30|90`
Daily clicks/impressions series plus **CTR opportunities** — queries with
≥100 impressions in the window whose CTR is below 60% of the typical CTR
for their position (i.e. the snippet underperforms).

```jsonc
{
  "data": {
    "series": [{ "date": "2026-06-01", "clicks": 14, "impressions": 800, "ctr": 1.8 }],
    "totalClicks": 412,
    "totalImpressions": 18250,
    "avgCtr": 2.3,
    "opportunities": [
      { "id": 17, "text": "cheap car rental", "urlPath": "/cheap", "group": null,
        "position": 4.1, "impressions": 2200, "clicks": 12, "ctr": 0.5, "expectedCtr": 8.0 }
    ]
  }
}
```

### `GET /api/projects/:id/pages`
Per-URL aggregation over the last 30 days: keyword count, best/avg
position, clicks, impressions, a 14-day avg-position trend, week-over-week
change and the page's top 5 keywords.

### `GET /api/projects/:id/visibility?days=30|90`
Share-of-voice style score per day. Each ranked keyword contributes a
weight from a CTR curve normalized so position 1 = 1.0; the score is the
sum as a percentage of all tracked keywords (100 = everything ranks #1).
Includes the project's annotations for chart markers.

### `GET /api/projects/:id/cannibalization`
Queries where ≥2 different URLs had desktop rankings in the last 14 days.
Groups are sorted by impressions at stake; pages inside a group by
position (best first — treat it as the "primary" page).

---

## Annotations

### `GET /api/projects/:id/annotations`
All annotations, newest first: `{ id, date: "YYYY-MM-DD", title, note }`.

### `POST /api/projects/:id/annotations`
Body: `{ "date": "2026-06-03", "title": "Rewrote titles", "note": "optional" }`.
Returns 201 with the created row. Annotations show up as dashed vertical
markers on the visibility chart and keyword trend modal.

### `DELETE /api/annotations/:id`
Removes one annotation.

---

## Site Health

### `GET /api/projects/:id/index-status`
Every distinct page path of the project with its cached URL Inspection
result (`verdict`, `coverageState`, `lastCrawlTime`, …). Unchecked pages
have `verdict: null`.

### `POST /api/projects/:id/index-status`
Runs live URL Inspection checks. Body `{ "urlPaths": ["/a", "/b"] }` checks
those paths; an empty body checks the 25 stalest pages. Calls run
sequentially (Google rejects parallel inspections) and results are cached.
Quota: **2,000 inspections/day per property**.

### `GET /api/projects/:id/pagespeed`
Cached PageSpeed results for the project (one row per path + strategy).

### `POST /api/projects/:id/pagespeed`
Body: `{ "urlPaths": ["/"], "strategy": "mobile" | "desktop" }` (max 3
paths per call — each audit takes 10–20s). Stores the Lighthouse
performance score plus LCP/CLS/INP/FCP/TTFB. Works without an API key on
the shared quota; set `PAGESPEED_API_KEY` for your own quota.

---

## Public sharing

### `GET /api/projects/:id/share`
Returns the project's active share link (`{ token, url, createdAt }`) or
`null`.

### `POST /api/projects/:id/share`
Creates a new share token (revoking any previous one) and returns it.

### `DELETE /api/projects/:id/share`
Revokes all share links for the project — shared URLs stop working
immediately.

### `GET /api/share/:token` *(public — no auth)*
Read-only dashboard payload for the public report page: project name,
domain, overview stats, 30-day visibility, 30-day traffic series and the
top 10 movers/drops. Returns 404 if the token was revoked. The 32-char
random token is the only credential — treat the URL like a password.
