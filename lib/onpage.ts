import axios from "axios";
import type { OnPageReport, RedirectHop } from "./types";

const UA =
  "Mozilla/5.0 (compatible; SEO-Dashboard/1.0; +https://github.com/) on-page checker";

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const m = tag.match(re);
  return m ? (m[2] ?? m[3] ?? "").trim() : null;
}

function metaContent(html: string, key: "name" | "property", value: string): string | null {
  const re = new RegExp(`<meta[^>]*\\b${key}\\s*=\\s*["']${value}["'][^>]*>`, "i");
  const tag = html.match(re);
  return tag ? attr(tag[0], "content") : null;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Follows up to 8 redirects manually so the full hop chain can be reported. */
async function followRedirects(startUrl: string): Promise<{
  hops: RedirectHop[];
  finalUrl: string;
  finalStatus: number;
  html: string;
}> {
  const hops: RedirectHop[] = [];
  let url = startUrl;
  let html = "";
  let finalStatus = 0;

  for (let i = 0; i < 8; i++) {
    const response = await axios.get<string>(url, {
      maxRedirects: 0,
      timeout: 20_000,
      responseType: "text",
      headers: { "User-Agent": UA, Accept: "text/html" },
      validateStatus: () => true,
    });
    finalStatus = response.status;
    const location = response.headers["location"] as string | undefined;

    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, url).toString();
      hops.push({ url, status: response.status, to: next });
      url = next;
      continue;
    }

    hops.push({ url, status: response.status, to: null });
    html = typeof response.data === "string" ? response.data : "";
    break;
  }

  return { hops, finalUrl: url, finalStatus, html };
}

async function checkRobotsAndSitemap(origin: string): Promise<{
  robotsTxt: boolean;
  sitemapUrls: string[];
  sitemapUrlCount: number | null;
}> {
  let robotsTxt = false;
  const sitemapUrls: string[] = [];
  let sitemapUrlCount: number | null = null;

  try {
    const robots = await axios.get<string>(`${origin}/robots.txt`, {
      timeout: 15_000,
      responseType: "text",
      headers: { "User-Agent": UA },
      validateStatus: () => true,
    });
    if (robots.status === 200 && typeof robots.data === "string") {
      robotsTxt = true;
      const re = /sitemap:\s*(\S+)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(robots.data)) !== null) sitemapUrls.push(m[1].trim());
    }
  } catch {
    /* robots.txt unreachable */
  }

  // Fall back to the conventional location, then count <loc> entries in the first sitemap
  const firstSitemap = sitemapUrls[0] ?? `${origin}/sitemap.xml`;
  try {
    const sitemap = await axios.get<string>(firstSitemap, {
      timeout: 15_000,
      responseType: "text",
      headers: { "User-Agent": UA },
      validateStatus: () => true,
    });
    if (sitemap.status === 200 && typeof sitemap.data === "string") {
      if (sitemapUrls.length === 0) sitemapUrls.push(firstSitemap);
      sitemapUrlCount = (sitemap.data.match(/<loc>/gi) ?? []).length;
    }
  } catch {
    /* sitemap unreachable */
  }

  return { robotsTxt, sitemapUrls, sitemapUrlCount };
}

/** Extracts links from the page and checks each one's HTTP status (capped). */
async function checkLinks(html: string, baseUrl: string): Promise<{
  links: import("./types").LinkStatus[];
  brokenCount: number;
}> {
  const base = new URL(baseUrl);
  const found = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const href = (m[2] ?? m[3] ?? "").trim();
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(href)) {
      continue;
    }
    try {
      found.add(new URL(href, base).toString().split("#")[0]);
    } catch {
      /* skip malformed href */
    }
  }

  const urls = Array.from(found).slice(0, 40);
  const links: import("./types").LinkStatus[] = [];

  // Check in small concurrent batches to avoid hammering the target
  for (let i = 0; i < urls.length; i += 8) {
    const batch = urls.slice(i, i + 8);
    const results = await Promise.all(
      batch.map(async (url): Promise<import("./types").LinkStatus> => {
        const internal = new URL(url).origin === base.origin;
        try {
          let res = await axios.head(url, {
            timeout: 12_000,
            maxRedirects: 5,
            headers: { "User-Agent": UA },
            validateStatus: () => true,
          });
          // Some servers reject HEAD — retry with a ranged GET
          if (res.status === 405 || res.status === 501) {
            res = await axios.get(url, {
              timeout: 12_000,
              maxRedirects: 5,
              headers: { "User-Agent": UA, Range: "bytes=0-0" },
              validateStatus: () => true,
            });
          }
          return { url, status: res.status, internal, ok: res.status < 400 };
        } catch {
          return { url, status: 0, internal, ok: false };
        }
      })
    );
    links.push(...results);
  }

  return { links, brokenCount: links.filter((l) => !l.ok).length };
}

export async function auditPage(rawUrl: string): Promise<OnPageReport> {
  const startUrl = normalizeUrl(rawUrl);
  const { hops, finalUrl, finalStatus, html } = await followRedirects(startUrl);
  const origin = new URL(finalUrl).origin;

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;

  const h1s = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  );
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;

  const canonicalTag = html.match(/<link[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i);
  const canonical = canonicalTag ? attr(canonicalTag[0], "href") : null;

  const htmlTag = html.match(/<html[^>]*>/i);
  const lang = htmlTag ? attr(htmlTag[0], "lang") : null;

  // JSON-LD structured data
  const jsonLdBlocks = Array.from(
    html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  );
  const schemaTypes = new Set<string>();
  for (const block of jsonLdBlocks) {
    const typeMatches = block[1].matchAll(/"@type"\s*:\s*"([^"]+)"/g);
    for (const t of typeMatches) schemaTypes.add(t[1]);
  }

  // Approximate visible word count
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = textOnly ? textOnly.split(" ").length : 0;

  const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi));
  const imagesMissingAlt = imgTags.filter((m) => attr(m[0], "alt") === null).length;

  const [{ robotsTxt, sitemapUrls, sitemapUrlCount }, { links, brokenCount }] =
    await Promise.all([checkRobotsAndSitemap(origin), checkLinks(html, finalUrl)]);

  const metaDescription = metaContent(html, "name", "description");

  return {
    requestedUrl: startUrl,
    finalUrl,
    status: finalStatus,
    redirects: hops.filter((h) => h.to !== null),
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical,
    robotsMeta: metaContent(html, "name", "robots"),
    viewport: metaContent(html, "name", "viewport"),
    lang,
    h1: h1s,
    h1Count: h1s.length,
    h2Count,
    wordCount,
    imageCount: imgTags.length,
    imagesMissingAlt,
    og: {
      title: metaContent(html, "property", "og:title"),
      description: metaContent(html, "property", "og:description"),
      image: metaContent(html, "property", "og:image"),
    },
    twitterCard: metaContent(html, "name", "twitter:card"),
    schemaCount: jsonLdBlocks.length,
    schemaTypes: Array.from(schemaTypes),
    robotsTxt,
    sitemapUrls,
    sitemapUrlCount,
    links,
    brokenLinkCount: brokenCount,
    linksChecked: links.length,
  };
}
