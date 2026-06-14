import { format } from "date-fns";
import { prisma } from "./prisma";
import { localeFor } from "./research";
import { positionOf, scrapeSerpDomains } from "./serp";
import type { CompetitorComparison, CompetitorRow } from "./types";

function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function toRow(c: {
  id: number;
  domain: string;
  label: string | null;
  isSelf: boolean;
  createdAt: Date;
}): CompetitorRow {
  return {
    id: c.id,
    domain: c.domain,
    label: c.label,
    isSelf: c.isSelf,
    createdAt: c.createdAt.toISOString(),
  };
}

/** Ensures a self row (the project's own domain) exists for head-to-head comparison. */
export async function ensureSelf(projectId: number): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;
  const selfDomain = normalizeDomain(project.domain);
  const existing = await prisma.competitor.findUnique({
    where: { projectId_domain: { projectId, domain: selfDomain } },
  });
  if (!existing) {
    await prisma.competitor.create({
      data: { projectId, domain: selfDomain, label: "Your site", isSelf: true },
    });
  }
}

export async function listCompetitors(projectId: number): Promise<CompetitorRow[]> {
  await ensureSelf(projectId);
  const rows = await prisma.competitor.findMany({
    where: { projectId },
    orderBy: [{ isSelf: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toRow);
}

export async function addCompetitor(
  projectId: number,
  domain: string,
  label?: string
): Promise<CompetitorRow> {
  const normalized = normalizeDomain(domain);
  if (!normalized) throw new Error("Enter a valid domain");
  const created = await prisma.competitor.upsert({
    where: { projectId_domain: { projectId, domain: normalized } },
    update: { label: label?.trim() || null },
    create: { projectId, domain: normalized, label: label?.trim() || null },
  });
  return toRow(created);
}

export async function removeCompetitor(
  projectId: number,
  competitorId: number
): Promise<void> {
  const competitor = await prisma.competitor.findFirst({
    where: { id: competitorId, projectId },
  });
  if (!competitor) throw new Error("Competitor not found");
  if (competitor.isSelf) throw new Error("Cannot remove your own site");
  await prisma.competitor.delete({ where: { id: competitorId } });
}

/** Picks the keywords to check when none are supplied: most-impressed tracked queries. */
async function defaultKeywords(projectId: number, limit = 10): Promise<string[]> {
  const rankings = await prisma.keywordRanking.groupBy({
    by: ["keywordId"],
    where: { keyword: { projectId } },
    _sum: { impressions: true },
    orderBy: { _sum: { impressions: "desc" } },
    take: limit,
  });
  const ids = rankings.map((r) => r.keywordId);
  if (ids.length === 0) return [];
  const keywords = await prisma.keyword.findMany({
    where: { id: { in: ids } },
    select: { id: true, text: true },
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  return keywords
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((k) => k.text);
}

/**
 * Scrapes Google once per keyword and records every tracked domain's position
 * for that keyword (today). Best-effort — Google may block datacenter IPs, in
 * which case positions come back null.
 */
export async function checkSerp(
  projectId: number,
  keywords?: string[]
): Promise<{ checked: number; keywords: string[] }> {
  await ensureSelf(projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const competitors = await prisma.competitor.findMany({ where: { projectId } });
  const targets =
    keywords && keywords.length > 0
      ? keywords.map((k) => k.trim()).filter(Boolean).slice(0, 15)
      : await defaultKeywords(projectId);

  if (targets.length === 0) throw new Error("No keywords to check — add keywords first");

  const { hl, gl } = localeFor(project.location);
  const day = format(new Date(), "yyyy-MM-dd");

  for (const keyword of targets) {
    const domains = await scrapeSerpDomains(keyword, hl, gl);
    for (const c of competitors) {
      const position = domains.length > 0 ? positionOf(domains, c.domain) : null;
      await prisma.competitorRanking.upsert({
        where: { competitorId_keyword_day: { competitorId: c.id, keyword, day } },
        update: { position, checkedAt: new Date() },
        create: { competitorId: c.id, keyword, position, day },
      });
    }
  }

  return { checked: targets.length, keywords: targets };
}

/** Latest position per keyword across all tracked domains. */
export async function getComparison(projectId: number): Promise<CompetitorComparison> {
  const domains = await listCompetitors(projectId);
  const competitorIds = domains.map((d) => d.id);
  if (competitorIds.length === 0) return { domains, rows: [] };

  const rankings = await prisma.competitorRanking.findMany({
    where: { competitorId: { in: competitorIds } },
    orderBy: { day: "desc" },
  });

  const domainById = new Map(domains.map((d) => [d.id, d.domain]));
  // For each keyword keep the latest day's positions
  const byKeyword = new Map<
    string,
    { day: string; positions: Record<string, number | null>; checkedAt: string }
  >();

  for (const r of rankings) {
    const dom = domainById.get(r.competitorId);
    if (!dom) continue;
    const entry = byKeyword.get(r.keyword);
    if (!entry || r.day > entry.day) {
      const positions: Record<string, number | null> = entry && r.day === entry.day ? entry.positions : {};
      positions[dom] = r.position;
      byKeyword.set(r.keyword, {
        day: r.day,
        positions,
        checkedAt: r.checkedAt.toISOString(),
      });
    } else if (r.day === entry.day) {
      entry.positions[dom] = r.position;
    }
  }

  const rows = Array.from(byKeyword.entries())
    .map(([keyword, v]) => ({ keyword, positions: v.positions, checkedAt: v.checkedAt }))
    .sort((a, b) => a.keyword.localeCompare(b.keyword));

  return { domains, rows };
}
