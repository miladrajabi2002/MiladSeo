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

## 7. Verify

1. Add a project whose **GSC Property** matches a property you own, e.g.
   `sc-domain:mysite.com` (domain property) or `https://mysite.com/`
   (URL-prefix property — trailing slash matters)
2. Click **Sync Now**
3. After it completes, the Overview tab fills with data

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `redirect_uri_mismatch` | The URI in Google Cloud must match `GOOGLE_REDIRECT_URI` character-for-character (scheme, host, path). |
| `access_denied` during consent | Your account isn't in the consent screen's Test users list. |
| Sync returns "User does not have sufficient permission" | The connected Google account doesn't have access to that GSC property, or the property string is wrong. |
| Sync succeeds but 0 keywords | GSC data is delayed 2–3 days, and brand-new sites may have no impressions yet. |
| `invalid_grant` | Refresh token revoked/expired — click **Connect Google** again. |
