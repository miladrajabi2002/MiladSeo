import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { format, subDays } from "date-fns";
import { prisma } from "./prisma";
import { detectAlerts } from "./rankings";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const REFRESH_TOKEN_KEY = "google_refresh_token";
const SYNC_DAYS = 30;
const ROW_LIMIT = 1000;

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in .env"
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getRefreshToken(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key: REFRESH_TOKEN_KEY },
  });
  if (setting?.value) return setting.value;
  return process.env.GOOGLE_REFRESH_TOKEN || null;
}

export async function saveRefreshToken(token: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key: REFRESH_TOKEN_KEY },
    update: { value: token },
    create: { key: REFRESH_TOKEN_KEY, value: token },
  });
}

/**
 * Removes the stored Google refresh token so the account is disconnected.
 * Returns false if a token is still present via the GOOGLE_REFRESH_TOKEN env
 * var (which this cannot clear) so the caller can warn the user.
 */
export async function clearRefreshToken(): Promise<boolean> {
  await prisma.setting.deleteMany({ where: { key: REFRESH_TOKEN_KEY } });
  return !process.env.GOOGLE_REFRESH_TOKEN;
}

export async function isGoogleConnected(): Promise<boolean> {
  try {
    return (await getRefreshToken()) !== null;
  } catch {
    return false;
  }
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (tokens.refresh_token) {
    await saveRefreshToken(tokens.refresh_token);
  } else if (!(await getRefreshToken())) {
    throw new Error(
      "Google did not return a refresh token. Remove the app from your Google account permissions and try again."
    );
  }
}

export async function getAuthorizedClient(): Promise<OAuth2Client> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error(
      "Google account is not connected. Open /api/auth/google to authorize."
    );
  }
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function extractUrlPath(pageUrl: string | undefined): string | null {
  if (!pageUrl) return null;
  try {
    const url = new URL(pageUrl);
    const path = url.pathname + url.search;
    return path || "/";
  } catch {
    return pageUrl;
  }
}

export interface SyncResult {
  keywordsTouched: number;
  rankingsWritten: number;
  alertsCreated: number;
}

// Projects currently mid-sync. A 30-day GSC pull is heavy (~30 API calls) and
// the per-date delete+createMany is not safe to run twice at once, so a second
// trigger for the same project is rejected instead of racing the first.
const syncing = new Set<number>();

export function isSyncing(projectId: number): boolean {
  return syncing.has(projectId);
}

/**
 * Pulls the last 30 days of Search Console data for a project, one day at a
 * time (query + page + device dimensions), upserts keywords and rankings,
 * then runs alert detection.
 */
export async function syncProject(projectId: number): Promise<SyncResult> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (syncing.has(projectId)) {
    throw new Error("A sync is already running for this project");
  }
  syncing.add(projectId);

  try {
    const auth = await getAuthorizedClient();
    const searchconsole = google.searchconsole({ version: "v1", auth });

    const existing = await prisma.keyword.findMany({
      where: { projectId },
      select: { id: true, text: true, urlPath: true },
    });
    const keywordMap = new Map<string, number>(
      existing.map((k) => [`${k.text}|${k.urlPath ?? ""}`, k.id])
    );

    let rankingsWritten = 0;

    for (let daysAgo = SYNC_DAYS; daysAgo >= 1; daysAgo--) {
      const dateStr = format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
      const response = await searchconsole.searchanalytics.query({
        siteUrl: project.gscProperty,
        requestBody: {
          startDate: dateStr,
          endDate: dateStr,
          dimensions: ["query", "page", "device"],
          rowLimit: ROW_LIMIT,
          dataState: "all",
        },
      });

      const rows = response.data.rows ?? [];
      if (rows.length === 0) continue;

      const date = new Date(`${dateStr}T00:00:00.000Z`);
      const creations: {
        keywordId: number;
        position: number | null;
        clicks: number | null;
        impressions: number | null;
        ctr: number | null;
        device: string;
        date: Date;
      }[] = [];

      for (const row of rows) {
        const keys = row.keys ?? [];
        const query = keys[0];
        const page = keys[1];
        const device = (keys[2] ?? "").toLowerCase();
        if (!query || (device !== "desktop" && device !== "mobile")) continue;

        const urlPath = extractUrlPath(page);
        const mapKey = `${query}|${urlPath ?? ""}`;
        let keywordId = keywordMap.get(mapKey);
        if (keywordId === undefined) {
          const created = await prisma.keyword.create({
            data: { text: query, urlPath, projectId },
          });
          keywordMap.set(mapKey, created.id);
          keywordId = created.id;
        }

        creations.push({
          keywordId,
          position: row.position ?? null,
          clicks: row.clicks !== undefined && row.clicks !== null ? Math.round(row.clicks) : null,
          impressions:
            row.impressions !== undefined && row.impressions !== null
              ? Math.round(row.impressions)
              : null,
          ctr: row.ctr ?? null,
          device,
          date,
        });
      }

      if (creations.length === 0) continue;

      // Replace any previously synced rows for this date so re-syncs are idempotent
      await prisma.keywordRanking.deleteMany({
        where: { date, keyword: { projectId } },
      });
      await prisma.keywordRanking.createMany({ data: creations });
      rankingsWritten += creations.length;
    }

    const alertsCreated = await detectAlerts(projectId);

    await prisma.project.update({
      where: { id: projectId },
      data: { lastSyncAt: new Date() },
    });
    await prisma.syncLog.create({
      data: {
        projectId,
        status: "success",
        message: `Synced ${rankingsWritten} rankings across ${keywordMap.size} keywords, ${alertsCreated} alerts created`,
      },
    });

    return {
      keywordsTouched: keywordMap.size,
      rankingsWritten,
      alertsCreated,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.create({
      data: { projectId, status: "error", message },
    });
    throw error;
  } finally {
    syncing.delete(projectId);
  }
}
