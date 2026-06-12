# Installation — Ubuntu 22.04 Production Guide

This guide takes a fresh Ubuntu 22.04 server to a fully running SEO Dashboard
behind Nginx with SSL.

---

## Step 1 — System Setup

Install Node.js 20 via nvm and git:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20
sudo apt update
sudo apt install git -y
```

Verify:

```bash
node -v   # v20.x
npm -v
```

---

## Step 2 — Clone

```bash
git clone https://github.com/yourusername/seo-dashboard.git
cd seo-dashboard
```

---

## Step 3 — Environment

```bash
cp .env.example .env
nano .env
```

Every variable explained:

| Variable | Example | Description |
| --- | --- | --- |
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite file path. Keep the default unless you want the DB elsewhere. |
| `ADMIN_EMAIL` | `me@mydomain.com` | The only email allowed to log in. |
| `ADMIN_PASSWORD_HASH` | `$2a$10$...` | bcrypt hash of your password — generated in Step 5. |
| `NEXTAUTH_SECRET` | `kJh3...==` | Random string for JWT signing. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | `https://seo.mydomain.com` | The public URL of the dashboard (use `http://localhost:3000` for local dev). |
| `GOOGLE_CLIENT_ID` | `1234-abc.apps.googleusercontent.com` | From Google Cloud Console (Step 10). |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | From Google Cloud Console (Step 10). |
| `GOOGLE_REDIRECT_URI` | `https://seo.mydomain.com/api/auth/google/callback` | Must exactly match the redirect URI registered in Google Cloud. |
| `GOOGLE_REFRESH_TOKEN` | *(empty)* | Optional. Auto-saved to the database after the in-app OAuth flow; only set manually if you prefer env-based storage. |
| `PORT` | `3000` | Port the Node server listens on. |
| `NODE_ENV` | `production` | Keep as `production` on the server. |
| `NEXT_PUBLIC_APP_NAME` | `SEO Dashboard` | Display name in the UI. |

---

## Step 4 — Install & Database

```bash
make install
make migrate
```

> First time only: if there are no migrations yet (fresh clone of your own
> fork), create them with `npx prisma migrate dev --name init` instead of
> `make migrate`.

---

## Step 5 — Generate password hash

```bash
make hash-password PASSWORD=MySecurePassword123
```

The command prints a ready-to-paste line like:

```
ADMIN_PASSWORD_HASH="\$2a\$10\$N9qo8uLOickgx2ZMRZoMye..."
```

Paste it into `.env` exactly as printed. The `$` signs **must** stay escaped
as `\$` — Next.js expands `$VAR` references inside `.env` values, which would
silently corrupt an unescaped bcrypt hash and make login fail.

---

## Step 6 — Build

```bash
make build
```

This runs `prisma generate`, `next build`, and compiles the custom cron
server to `dist/server.js`.

---

## Step 7 — Run with PM2

```bash
npm install -g pm2
pm2 start npm --name "seo-dashboard" -- start
pm2 save
pm2 startup
```

Check it's alive:

```bash
pm2 status
curl -I http://localhost:3000/login
```

---

## Step 8 — Nginx config

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/seo-dashboard
```

Paste:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name seo.mydomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;   # manual syncs can take a few minutes
        proxy_send_timeout 300s;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/seo-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 9 — SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seo.mydomain.com
```

Certbot rewrites the Nginx config for HTTPS and installs auto-renewal.

---

## Step 10 — Google Cloud Setup

Follow [GOOGLE_SETUP.md](GOOGLE_SETUP.md) to create OAuth credentials, then:

1. Log in to the dashboard
2. Click **Connect Google** in the header
3. Complete the consent flow — the refresh token is saved automatically
4. Open a project and click **Sync Now**

---

## Updating

```bash
cd seo-dashboard
git pull
make install
make migrate
make build
pm2 restart seo-dashboard
```
