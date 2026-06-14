import cron from "node-cron";
import { prisma } from "./prisma";
import { isGoogleConnected, syncProject } from "./gsc";
import { inspectUrls } from "./inspection";
import { getPages } from "./insights";
import { runPageSpeed } from "./pagespeed";
import { auditPage } from "./onpage";

/** Syncs every project sequentially; one failure never blocks the rest. */
export async function runDailySync(): Promise<void> {
  const connected = await isGoogleConnected();
  if (!connected) {
    console.log("[syncJob] Skipping daily sync — Google account not connected");
    return;
  }

  const projects = await prisma.project.findMany({ select: { id: true, domain: true } });
  console.log(`[syncJob] Starting daily sync for ${projects.length} project(s)`);

  for (const project of projects) {
    try {
      const result = await syncProject(project.id);
      console.log(
        `[syncJob] ${project.domain}: ${result.rankingsWritten} rankings, ${result.alertsCreated} alerts`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[syncJob] ${project.domain} failed: ${message}`);
    }
  }

  console.log("[syncJob] Daily sync finished");
}

/**
 * Daily site-health pass: refreshes a stale batch of index statuses, runs
 * PageSpeed on each project's top pages (so the history chart accrues a daily
 * point), and audits the homepage for broken links. Each step is best-effort.
 */
export async function runDailyHealth(): Promise<void> {
  if (!(await isGoogleConnected())) {
    console.log("[healthJob] Skipping — Google account not connected");
    return;
  }

  const projects = await prisma.project.findMany({
    select: { id: true, domain: true },
  });
  console.log(`[healthJob] Starting daily health pass for ${projects.length} project(s)`);

  for (const project of projects) {
    // 1) Index coverage — refresh the stalest batch (also appends history)
    try {
      await inspectUrls(project.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[healthJob] ${project.domain} index check failed: ${message}`);
    }

    // 2) PageSpeed for the top pages by clicks (mobile) — appends daily history
    try {
      const pages = await getPages(project.id, 30);
      const topPaths = pages.slice(0, 3).map((p) => p.urlPath);
      if (topPaths.length > 0) {
        await runPageSpeed(project.id, topPaths, "mobile");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[healthJob] ${project.domain} pagespeed failed: ${message}`);
    }

    // 3) Broken-link monitoring on the homepage
    try {
      const report = await auditPage(`https://${project.domain.replace(/\/$/, "")}`);
      if (report.brokenLinkCount > 0) {
        await prisma.syncLog.create({
          data: {
            projectId: project.id,
            status: "error",
            message: `${report.brokenLinkCount} broken link(s) found on homepage`,
          },
        });
        console.warn(
          `[healthJob] ${project.domain}: ${report.brokenLinkCount} broken link(s) on homepage`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[healthJob] ${project.domain} link check failed: ${message}`);
    }
  }

  console.log("[healthJob] Daily health pass finished");
}

/** Schedules the daily GSC sync (04:00) and the health pass (05:00). */
export function startCron(): void {
  cron.schedule("0 4 * * *", () => {
    void runDailySync();
  });
  cron.schedule("0 5 * * *", () => {
    void runDailyHealth();
  });
  console.log("[syncJob] Cron scheduled: GSC sync 04:00, health pass 05:00");
}
