import cron from "node-cron";
import { prisma } from "./prisma";
import { isGoogleConnected, syncProject } from "./gsc";

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

/** Schedules the daily sync at 4:00 AM server time. */
export function startCron(): void {
  cron.schedule("0 4 * * *", () => {
    void runDailySync();
  });
  console.log("[syncJob] Cron scheduled: daily GSC sync at 04:00");
}
