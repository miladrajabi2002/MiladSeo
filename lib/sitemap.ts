import axios from "axios";
import { prisma } from "./prisma";
import type { SitemapReport, SitemapUrlEntry } from "./types";

const UA = "Mozilla/5.0 (compatible; SEO-Dashboard/1.0; +https://github.com/) sitemap explorer";
const MAX_SITEMAPS = 20; // safety cap on nested sitemap fetches
const MAX_URLS = 5000; // safety cap on parsed URLs

function tag(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1].trim());
  return out;
}

function firstTag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim();
}

async function fetchXml(url: string): Promise<string | null> {
  try {
    const res = await axios.get<string>(url, {
      timeout: 20_000,
      responseType: "text",
      headers: { "User-Agent": UA },
      validateStatus: () => true,
    });
    if (res.status === 200 && typeof res.data === "string") return res.data;
    return null;
  } catch {
    return null;
  }
}

/** Discovers sitemap URLs from robots.txt, falling back to /sitemap.xml. */
async function discoverSitemaps(origin: string): Promise<string[]> {
  const found: string[] = [];
  const robots = await fetchXml(`${origin}/robots.txt`);
  if (robots) {
    const re = /sitemap:\s*(\S+)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(robots)) !== null) found.push(m[1].trim());
  }
  if (found.length === 0) found.push(`${origin}/sitemap.xml`);
  return Array.from(new Set(found));
}

/**
 * Parses a project's sitemap(s) — following sitemap-index files one level —
 * and flags which URLs already have a tracked keyword pointing at them.
 */
export async function exploreSitemap(projectId: number): Promise<SitemapReport> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const origin = `https://${project.domain.replace(/\/$/, "")}`;
  const errors: string[] = [];
  const seenSitemaps = new Set<string>();
  const queue = await discoverSitemaps(origin);
  const usedSitemaps: string[] = [];

  interface Raw {
    loc: string;
    lastmod: string | null;
  }
  const urls: Raw[] = [];

  while (queue.length > 0 && seenSitemaps.size < MAX_SITEMAPS && urls.length < MAX_URLS) {
    const sm = queue.shift() as string;
    if (seenSitemaps.has(sm)) continue;
    seenSitemaps.add(sm);

    const xml = await fetchXml(sm);
    if (!xml) {
      errors.push(sm);
      continue;
    }
    usedSitemaps.push(sm);

    // Sitemap index → enqueue child sitemaps
    if (/<sitemapindex[\s>]/i.test(xml)) {
      for (const block of tag(xml, "sitemap")) {
        const loc = firstTag(block, "loc");
        if (loc) queue.push(decode(loc));
      }
      continue;
    }

    // URL set → collect entries
    for (const block of tag(xml, "url")) {
      const loc = firstTag(block, "loc");
      if (!loc) continue;
      urls.push({ loc: decode(loc), lastmod: firstTag(block, "lastmod") });
      if (urls.length >= MAX_URLS) break;
    }
  }

  // Which paths are already tracked
  const tracked = await prisma.keyword.findMany({
    where: { projectId, urlPath: { not: null } },
    select: { urlPath: true },
    distinct: ["urlPath"],
  });
  const trackedPaths = new Set(tracked.map((k) => k.urlPath as string));

  const toPath = (loc: string): string => {
    try {
      const u = new URL(loc);
      return (u.pathname + u.search) || "/";
    } catch {
      return loc;
    }
  };

  const seenLoc = new Set<string>();
  const entries: SitemapUrlEntry[] = [];
  for (const u of urls) {
    if (seenLoc.has(u.loc)) continue;
    seenLoc.add(u.loc);
    const path = toPath(u.loc);
    entries.push({
      loc: u.loc,
      path,
      lastmod: u.lastmod ? decode(u.lastmod).slice(0, 10) : null,
      tracked: trackedPaths.has(path),
    });
  }

  entries.sort((a, b) => Number(a.tracked) - Number(b.tracked) || a.path.localeCompare(b.path));
  const trackedCount = entries.filter((e) => e.tracked).length;

  return {
    sitemaps: usedSitemaps,
    totalUrls: entries.length,
    trackedCount,
    untrackedCount: entries.length - trackedCount,
    entries,
    errors,
  };
}
