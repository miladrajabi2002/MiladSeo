# Google Cloud Setup

The dashboard reads ranking data from the **Google Search Console API** and
writes the Live Sheet via the **Google Sheets API**. Both are free. You need a
Google Cloud project with OAuth2 credentials.

---

## 1. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown in the top bar → **New Project**
3. Name it e.g. `seo-dashboard` → **Create**
4. Make sure the new project is selected in the top bar

## 2. Enable the APIs

1. Open **APIs & Services → Library** from the left menu
2. Search for **"Google Search Console API"** → open it → click **Enable**
3. Go back to the Library, search for **"Google Sheets API"** → **Enable**
4. (Optional but recommended) Also enable **"Google Drive API"** — used by the
   `drive.file` scope when creating the Live Sheet

## 3. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen**
2. User type: **External** → **Create**
3. App name: `SEO Dashboard`, add your email as support + developer contact
4. Scopes: you can skip adding scopes here (they're requested at runtime)
5. **Test users**: add your own Google account email — this is required while
   the app is in "Testing" status
6. Save. You do **not** need to publish the app; testing mode is fine for a
   single admin.

> Note: in Testing mode Google expires refresh tokens after 7 days **only for
> some scopes**; for these scopes tokens persist, but if you ever see
> `invalid_grant` errors, reconnect via the **Connect Google** button.

## 4. Create OAuth2 credentials

1. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `seo-dashboard-web`
4. Under **Authorized redirect URIs** click **+ Add URI** and enter exactly:

   ```
   https://yourdomain.com/api/auth/google/callback
   ```

   For local development also add:

   ```
   http://localhost:3000/api/auth/google/callback
   ```

5. Click **Create**

## 5. Copy credentials to .env

A dialog shows your **Client ID** and **Client Secret**. Put them in `.env`:

```env
GOOGLE_CLIENT_ID="1234567890-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxx"
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
```

Restart the app after editing `.env` (`pm2 restart seo-dashboard`).

## 6. Connect your Google account

1. Log in to the dashboard
2. Click **Connect Google** in the header (only shown while disconnected)
3. Choose the Google account that owns your Search Console properties
4. Approve the requested permissions:
   - *View Search Console data* (read-only)
   - *See, edit, create spreadsheets* (for the Live Sheet)
   - *See and manage files created by this app* (Drive)
5. You're redirected back — the **refresh token is saved automatically** to
   the database. The header now shows "Google connected".

## 7. Add your site to Search Console

Before syncing, the site must be **verified** in Search Console under the same
Google account you connected. Skip this step if the site is already there.

### Property types

Search Console offers two property types — pick whichever fits:

| Type | Covers | GSC Property string to use in the dashboard |
|---|---|---|
| **Domain property** (recommended) | All subdomains and both `http`/`https` | `sc-domain:yourdomain.com` |
| **URL-prefix property** | Only the exact URL you register | `https://yourdomain.com/` (trailing slash required) |

### Steps to add a Domain property

1. Open [search.google.com/search-console](https://search.google.com/search-console)
2. Click the property dropdown (top-left) → **Add property**
3. Choose **Domain**, enter `yourdomain.com` → **Continue**
4. Google shows a DNS TXT record, e.g.:

   ```
   google-site-verification=XXXXXXXXXXXXXXXX
   ```

5. Log in to your domain registrar (Cloudflare, Namecheap, …), go to DNS
   settings, and add a new **TXT record** with that value
6. Click **Verify** in Google Search Console (propagation usually takes < 1 minute
   on Cloudflare, up to a few hours on others)

### Steps to add a URL-prefix property

1. Same as above, but choose **URL prefix** and enter the full URL
   `https://yourdomain.com/`
2. Verification options: HTML file (upload to server root), HTML meta tag (add to
   `<head>`), Google Analytics, or DNS record — pick whichever is easiest

After verification, go back to the dashboard → Add Project → click **Refresh**
in the GSC Property picker. Your new property will appear in the dropdown.

---

## 8. Permission levels and why they matter

The Search Analytics API (used for sync) requires **Owner** or **Full User**
access. **Restricted User** access lets you view data in the GSC web UI but
blocks API access — the sync will return:

```
User does not have sufficient permission for site '...'
```

| Permission level | GSC web UI | Search Analytics API | How to check |
|---|---|---|---|
| **Owner** | Full access | Yes | Verified the property yourself |
| **Full User** | Full access | Yes | Added explicitly at this level |
| **Restricted User** | Read-only view | **No** | Default when someone adds you without specifying level |
| **Unverified** | No access | No | — |

To check or change your access level:

1. Open Search Console → select the property → **Settings** (gear icon)
2. **Users and permissions**
3. Find your email. If it shows **Restricted**, click the three-dot menu → **Change permission** → set to **Full**

If the property belongs to another Google account (e.g. a client's account), ask
that account's owner to add your email as **Full User** or **Owner**.

---

## 9. Verify the full flow

1. Add a project — the GSC Property dropdown shows only properties your account
   has **Owner** or **Full User** access to
2. Select the property and click **Create Project**
3. Open the project → click **Sync Now**
4. After it completes, the Overview tab fills with data

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `redirect_uri_mismatch` | The URI in Google Cloud must match `GOOGLE_REDIRECT_URI` character-for-character (scheme, host, path). |
| `access_denied` during consent | Your account isn't in the consent screen's Test users list (Step 3 above). |
| Sync returns "User does not have sufficient permission" | Your Google account has **Restricted** access to that property (see Section 8), or the property string format is wrong. Check Search Console → Settings → Users and permissions. |
| Property not in the dropdown | The site isn't verified in Search Console under the connected account, or the account has Restricted access only. See Sections 7 and 8. |
| Sync succeeds but 0 keywords | GSC data is delayed 2–3 days, and brand-new sites may have no impressions yet. |
| `invalid_grant` | Refresh token revoked/expired — click **Connect Google** again. |
