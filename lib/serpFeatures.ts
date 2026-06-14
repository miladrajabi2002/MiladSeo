import { google } from "googleapis";
import { format, subDays } from "date-fns";
import { prisma } from "./prisma";
import { getAuthorizedClient } from "./gsc";
import type { SerpAppearanceRow } from "./types";

// Friendlier labels for Google's searchAppearance enum values
const LABELS: Record<string, string> = {
  AMP_BLUE_LINK: "AMP",
  RICHCARD: "Rich card",
  RICH_SNIPPET: "Rich snippet",
  WEBLITE: "Web Light",
  ACTION: "Action",
  PAGE_EXPERIENCE: "Page experience",
  REVIEW_SNIPPET: "Review snippet",
  PRODUCT_SNIPPETS: "Product snippet",
  MERCHANT_LISTINGS: "Merchant listing",
  TPF_FAQ: "FAQ",
  TPF_HOWTO: "How-to",
  TPF_QA: "Q&A",
  VIDEO: "Video",
  EVENT: "Event",
  RECIPE_FEATURE: "Recipe",
  JOB_LISTING: "Job listing",
  ORGANIC_SHOPPING: "Organic shopping",
  TRANSLATED_RESULT: "Translated result",
  VIDEO_HOST: "Video (hosted)",
};

export function appearanceLabel(value: string): string {
  return LABELS[value] ?? value.replace(/_/g, " ").toLowerCase();
}

/**
 * Breaks the project's Search Console traffic down by SERP appearance type
 * (rich snippets, FAQ, video, etc.) for the last `days` days. Free — uses the
 * same connected Google account.
 */
export async function getSerpAppearances(
  projectId: number,
  days = 30
): Promise<SerpAppearanceRow[]> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const auth = await getAuthorizedClient();
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const endDate = format(subDays(new Date(), 2), "yyyy-MM-dd"); // GSC lags ~2 days
  const startDate = format(subDays(new Date(), days + 2), "yyyy-MM-dd");

  const response = await searchconsole.searchanalytics.query({
    siteUrl: project.gscProperty,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["searchAppearance"],
      rowLimit: 50,
    },
  });

  const rows = response.data.rows ?? [];
  return rows
    .map((row) => {
      const appearance = appearanceLabel(row.keys?.[0] ?? "(unknown)");
      const clicks = Math.round(row.clicks ?? 0);
      const impressions = Math.round(row.impressions ?? 0);
      return {
        appearance,
        clicks,
        impressions,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : null,
        position: row.position !== undefined && row.position !== null
          ? Math.round(row.position * 10) / 10
          : null,
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}
