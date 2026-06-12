import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { getOverviewStats, getMovers } from "./rankings";
import { getTrafficSeries, getVisibility } from "./insights";
import type { PublicDashboard, ShareLinkInfo } from "./types";

function shareUrl(token: string): string {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/share/${token}`;
}

export async function getShareLink(
  projectId: number
): Promise<ShareLinkInfo | null> {
  const link = await prisma.shareLink.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  if (!link) return null;
  return {
    token: link.token,
    url: shareUrl(link.token),
    createdAt: link.createdAt.toISOString(),
  };
}

/** Creates a fresh token; any previous links for the project are revoked. */
export async function createShareLink(
  projectId: number
): Promise<ShareLinkInfo> {
  await prisma.shareLink.deleteMany({ where: { projectId } });
  const link = await prisma.shareLink.create({
    data: { projectId, token: randomBytes(24).toString("base64url") },
  });
  return {
    token: link.token,
    url: shareUrl(link.token),
    createdAt: link.createdAt.toISOString(),
  };
}

export async function revokeShareLinks(projectId: number): Promise<void> {
  await prisma.shareLink.deleteMany({ where: { projectId } });
}

/** Resolves a public token to the read-only dashboard payload. */
export async function getPublicDashboard(
  token: string
): Promise<PublicDashboard | null> {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { project: true },
  });
  if (!link) return null;

  const projectId = link.projectId;
  const [overview, visibility, traffic, movers] = await Promise.all([
    getOverviewStats(projectId),
    getVisibility(projectId, 30),
    getTrafficSeries(projectId, 30),
    getMovers(projectId),
  ]);

  return {
    projectName: link.project.name,
    domain: link.project.domain,
    lastSyncAt: link.project.lastSyncAt?.toISOString() ?? null,
    overview,
    visibility,
    traffic,
    movers: {
      improved: movers.improved.slice(0, 10),
      dropped: movers.dropped.slice(0, 10),
    },
  };
}
