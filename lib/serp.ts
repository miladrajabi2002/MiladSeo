import axios from "axios";

const ENDPOINT = "https://www.google.com/search";

// A desktop browser UA improves the odds of getting real result HTML rather
// than a consent interstitial. Google may still rate-limit datacenter IPs.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const GOOGLE_HOSTS = /(^|\.)google\.|gstatic\.com|googleusercontent\.com|youtube\.com\/redirect/i;

function rootDomain(host: string): string {
  return host.replace(/^www\./i, "").toLowerCase();
}

/**
 * Scrapes the first ~20 organic results for a query and returns the ordered
 * list of distinct result domains (position = index + 1). Best-effort: Google
 * may serve a consent page or block the request, in which case this returns [].
 */
export async function scrapeSerpDomains(
  query: string,
  hl = "en",
  gl = "us"
): Promise<string[]> {
  let html = "";
  try {
    const res = await axios.get<string>(ENDPOINT, {
      params: { q: query, num: 20, hl, gl, pws: 0 },
      timeout: 20_000,
      responseType: "text",
      headers: {
        "User-Agent": UA,
        "Accept-Language": `${hl},en;q=0.8`,
        Accept: "text/html",
        Cookie: "CONSENT=YES+",
      },
      validateStatus: () => true,
    });
    if (res.status !== 200 || typeof res.data !== "string") return [];
    html = res.data;
  } catch {
    return [];
  }

  const domains: string[] = [];
  const seen = new Set<string>();

  // Match both direct result links and /url?q= redirect links
  const patterns = [
    /<a[^>]+href="\/url\?q=(https?:\/\/[^"&]+)/gi,
    /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      let url = m[1];
      try {
        url = decodeURIComponent(url);
      } catch {
        /* keep raw */
      }
      let host: string;
      try {
        host = new URL(url).hostname;
      } catch {
        continue;
      }
      if (GOOGLE_HOSTS.test(host)) continue;
      const domain = rootDomain(host);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      domains.push(domain);
      if (domains.length >= 20) break;
    }
    if (domains.length >= 20) break;
  }

  return domains;
}

/**
 * Returns the 1-based position of `domain` within a scraped result list, or
 * null if it does not appear. Matches on root-domain suffix so subdomains
 * (m.example.com) still match example.com.
 */
export function positionOf(domains: string[], domain: string): number | null {
  const target = rootDomain(domain.replace(/^https?:\/\//, "").split("/")[0]);
  const idx = domains.findIndex((d) => d === target || d.endsWith(`.${target}`));
  return idx === -1 ? null : idx + 1;
}
