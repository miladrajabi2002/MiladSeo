import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { prisma } from "./prisma";
import { getOverviewStats, getMovers } from "./rankings";
import {
  getTraffic,
  getVisibility,
  getCannibalization,
  getPages,
  getComparison,
} from "./insights";
import { getPageSpeedResults } from "./pagespeed";
import { getIndexStatuses } from "./inspection";
import { getCruxHistory } from "./crux";
import { getGa4Summary } from "./ga4";
import { auditPage } from "./onpage";
import type { AiAnalysis, AiConfigStatus, AiProvider } from "./types";

const PROVIDER_KEY = "ai_provider";
const APIKEY_KEY = "ai_api_key";
const MODEL_KEY = "ai_model";

const DEFAULT_MODEL: Record<AiProvider, string> = {
  anthropic: "claude-opus-4-8",
  openai: "gpt-4o",
  openrouter: "deepseek/deepseek-chat",
};

// OpenAI-compatible providers share the chat-completions shape
const OPENAI_COMPAT: Record<"openai" | "openrouter", { base: string }> = {
  openai: { base: "https://api.openai.com/v1" },
  openrouter: { base: "https://openrouter.ai/api/v1" },
};

interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

export function isProvider(value: unknown): value is AiProvider {
  return value === "anthropic" || value === "openai" || value === "openrouter";
}

export function defaultModelFor(provider: AiProvider): string {
  return DEFAULT_MODEL[provider];
}

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getAiConfig(): Promise<AiConfig | null> {
  const provider = await readSetting(PROVIDER_KEY);
  const apiKey = await readSetting(APIKEY_KEY);
  if (!isProvider(provider) || !apiKey) return null;
  const model = (await readSetting(MODEL_KEY)) || DEFAULT_MODEL[provider];
  return { provider, apiKey, model };
}

export async function getAiStatus(): Promise<AiConfigStatus> {
  const config = await getAiConfig();
  if (!config) return { configured: false, provider: null, model: null };
  return { configured: true, provider: config.provider, model: config.model };
}

export async function saveAiConfig(
  provider: AiProvider,
  apiKey: string,
  model: string | null
): Promise<void> {
  const entries: [string, string][] = [
    [PROVIDER_KEY, provider],
    [APIKEY_KEY, apiKey],
    [MODEL_KEY, model?.trim() || DEFAULT_MODEL[provider]],
  ];
  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

export async function clearAiConfig(): Promise<void> {
  await prisma.setting.deleteMany({
    where: { key: { in: [PROVIDER_KEY, APIKEY_KEY, MODEL_KEY] } },
  });
}

function openAiHeaders(provider: "openai" | "openrouter", apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://github.com/miladrajabi2002/MiladSeo";
    headers["X-Title"] = "SEO Dashboard";
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Model discovery
// ---------------------------------------------------------------------------

/** Lists selectable models for a provider using the given key. */
export async function listModels(provider: AiProvider, apiKey: string): Promise<string[]> {
  if (provider === "anthropic") {
    const res = await axios.get<{ data: { id: string }[] }>(
      "https://api.anthropic.com/v1/models",
      {
        params: { limit: 100 },
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        timeout: 30_000,
      }
    );
    return res.data.data.map((m) => m.id);
  }

  const { base } = OPENAI_COMPAT[provider];
  const res = await axios.get<{ data: { id: string }[] }>(`${base}/models`, {
    headers: openAiHeaders(provider, apiKey),
    timeout: 30_000,
  });
  let ids = res.data.data.map((m) => m.id);
  if (provider === "openai") {
    // Keep chat-capable models only (drop embeddings/tts/whisper/etc.)
    ids = ids.filter((id) => /gpt|^o\d|chatgpt/i.test(id) && !/embedding|whisper|tts|audio|image|dall/i.test(id));
  }
  return ids.sort();
}

// ---------------------------------------------------------------------------
// Provider calls
// ---------------------------------------------------------------------------

export async function testConnection(config: AiConfig): Promise<void> {
  if (config.provider === "anthropic") {
    const client = new Anthropic({ apiKey: config.apiKey });
    await client.messages.create({
      model: config.model,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    });
    return;
  }
  const { base } = OPENAI_COMPAT[config.provider];
  await axios.post(
    `${base}/chat/completions`,
    {
      model: config.model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    },
    { headers: openAiHeaders(config.provider, config.apiKey), timeout: 30_000 }
  );
}

interface CompleteOptions {
  maxTokens?: number;
  json?: boolean;
}

async function complete(
  config: AiConfig,
  system: string,
  user: string,
  opts: CompleteOptions = {}
): Promise<string> {
  const maxTokens = opts.maxTokens ?? 4000;

  if (config.provider === "anthropic") {
    const client = new Anthropic({ apiKey: config.apiKey });
    const message = await client.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: user }],
    });
    return message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }

  const { base } = OPENAI_COMPAT[config.provider];
  const response = await axios.post<{ choices: { message: { content: string } }[] }>(
    `${base}/chat/completions`,
    {
      model: config.model,
      max_tokens: maxTokens,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    { headers: openAiHeaders(config.provider, config.apiKey), timeout: 180_000 }
  );
  return response.data.choices[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Master audit (all reports)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a world-class technical SEO consultant auditing a website using ALL of its available data: Google Search Console rankings, traffic, Core Web Vitals (lab + real-user CrUX), Google Analytics 4 behaviour and on-page signals. Think like a senior SEO strategist: find the highest-leverage opportunities, diagnose risks, and give specific, actionable advice a site owner or web designer can execute.

Return ONLY a single JSON object (no markdown, no code fences, no prose around it) matching exactly this shape:
{
  "healthScore": number (0-100, your overall SEO health rating),
  "summary": string (2-4 sentence executive summary in the same language as the keywords),
  "recommendations": [
    {
      "title": string (short, action-oriented),
      "category": "content" | "technical" | "keywords" | "performance" | "onpage" | "links",
      "priority": "high" | "medium" | "low",
      "impact": string (one line: what improves if done),
      "effort": "low" | "medium" | "high",
      "detail": string (2-4 sentences: exactly what to do and why, referencing the data)
    }
  ],
  "quickWins": [string] (3-6 concrete actions doable this week),
  "risks": [string] (issues actively hurting rankings)
}
Provide 6-12 prioritized recommendations, ordered most important first. Be specific and reference real numbers from the data. Write user-facing text in the language the keywords are written in (e.g. Persian if keywords are Persian).`;

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

export async function runAiAnalysis(projectId: number): Promise<AiAnalysis> {
  const config = await getAiConfig();
  if (!config) throw new Error("No AI provider is configured. Add an API key first.");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const [overview, movers, traffic, visibility, cannibalization, pages, speed, index] =
    await Promise.all([
      getOverviewStats(projectId),
      getMovers(projectId),
      getTraffic(projectId, 30),
      getVisibility(projectId, 30),
      getCannibalization(projectId),
      getPages(projectId),
      getPageSpeedResults(projectId),
      getIndexStatuses(projectId),
    ]);

  // Optional/enriching sources — never fail the audit if one is unavailable
  const [crux, ga4, homepage] = await Promise.all([
    safe(getCruxHistory(projectId, "PHONE")),
    project.ga4PropertyId ? safe(getGa4Summary(projectId, 28)) : Promise.resolve(null),
    safe(auditPage(`https://${project.domain.replace(/\/$/, "")}`)),
  ]);

  const snapshot = {
    site: { domain: project.domain, location: project.location },
    overview: {
      totalKeywords: overview.totalKeywords,
      avgPosition: overview.avgDesktop,
      top10: overview.top10,
      top20: overview.top20,
      top50: overview.top50,
      distribution: overview.distribution.map((d) => ({ bucket: d.bucket, count: d.count })),
      topKeywords: overview.topKeywords.slice(0, 10).map((k) => ({
        keyword: k.text, position: k.desktopPos, clicks: k.clicks, impressions: k.impressions,
      })),
    },
    visibility: { current: visibility.current, weekChange: visibility.weekChange },
    traffic: {
      totalClicks: traffic.totalClicks,
      totalImpressions: traffic.totalImpressions,
      avgCtr: traffic.avgCtr,
      ctrOpportunities: traffic.opportunities.slice(0, 15).map((o) => ({
        keyword: o.text, position: o.position, impressions: o.impressions, ctr: o.ctr, expectedCtr: o.expectedCtr,
      })),
    },
    movers: {
      improved: movers.improved.slice(0, 10).map((m) => ({ keyword: m.text, delta: m.delta, nowPos: m.nowPos })),
      dropped: movers.dropped.slice(0, 10).map((m) => ({ keyword: m.text, delta: m.delta, nowPos: m.nowPos })),
    },
    cannibalization: cannibalization.slice(0, 8).map((g) => ({
      keyword: g.text, competingPages: g.pages.map((p) => ({ url: p.urlPath, position: p.position })),
    })),
    topPages: pages.slice(0, 10).map((p) => ({
      url: p.urlPath, keywords: p.keywordCount, bestPosition: p.bestPosition, clicks: p.clicks, impressions: p.impressions,
    })),
    indexCoverage: index
      .filter((r) => r.verdict)
      .slice(0, 20)
      .map((r) => ({ url: r.urlPath, verdict: r.verdict, coverage: r.coverageState })),
    pageSpeed: speed.map((s) => ({ url: s.urlPath, strategy: s.strategy, score: s.score, lcpMs: s.lcpMs, cls: s.cls, inpMs: s.inpMs })),
    coreWebVitalsField: crux?.latest
      ? { lcpMs: crux.latest.lcp, inpMs: crux.latest.inp, cls: crux.latest.cls }
      : null,
    analytics: ga4
      ? {
          sessions: ga4.totals.sessions,
          users: ga4.totals.users,
          conversions: ga4.totals.conversions,
          bounceRate: ga4.totals.bounceRate,
          avgSessionDuration: ga4.totals.avgSessionDuration,
          channels: ga4.channels.slice(0, 6),
          topPages: ga4.topPages.slice(0, 8),
        }
      : null,
    homepageOnPage: homepage
      ? {
          title: homepage.title,
          titleLength: homepage.titleLength,
          metaDescription: homepage.metaDescription,
          h1Count: homepage.h1Count,
          canonical: homepage.canonical,
          schemaTypes: homepage.schemaTypes,
          wordCount: homepage.wordCount,
          brokenLinks: homepage.brokenLinkCount,
          robotsTxt: homepage.robotsTxt,
          sitemap: homepage.sitemapUrls.length > 0,
        }
      : null,
  };

  const user = `Here is the full data snapshot for the site. Analyse everything and respond with the JSON object.\n\n${JSON.stringify(snapshot, null, 2)}`;
  const raw = await complete(config, SYSTEM_PROMPT, user, { maxTokens: 8000, json: true });
  const analysis = extractJson(raw);
  return {
    ...analysis,
    generatedAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
  };
}

function extractJson(raw: string): AiAnalysis {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI response did not contain valid JSON");
  const parsed = JSON.parse(text.slice(start, end + 1)) as AiAnalysis;
  if (typeof parsed.healthScore !== "number" || !Array.isArray(parsed.recommendations)) {
    throw new Error("The AI response was missing required fields");
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Per-tab AI assist (focused, conversational)
// ---------------------------------------------------------------------------

export type AssistArea = "overview" | "insights" | "health" | "onpage";

const ASSIST_SYSTEM = `You are an expert SEO consultant embedded in an analytics dashboard. You are given the data currently shown on one tab. Give focused, practical advice the user can act on right now. Be concise and specific, reference the real numbers, and format as short Markdown with a few bold headers and bullet points. Reply in the same language as the keywords/queries in the data (Persian if they are Persian). Do not invent data you were not given.`;

async function gatherAssistData(
  area: AssistArea,
  projectId: number,
  url?: string
): Promise<Record<string, unknown>> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const base = { domain: project?.domain, location: project?.location };

  if (area === "overview") {
    const [overview, visibility, week, month] = await Promise.all([
      getOverviewStats(projectId),
      getVisibility(projectId, 30),
      getComparison(projectId, "week"),
      getComparison(projectId, "month"),
    ]);
    return { ...base, overview, visibility: { current: visibility.current, weekChange: visibility.weekChange }, week, month };
  }

  if (area === "insights") {
    const [traffic, cannibalization] = await Promise.all([
      getTraffic(projectId, 30),
      getCannibalization(projectId),
    ]);
    return {
      ...base,
      totals: { clicks: traffic.totalClicks, impressions: traffic.totalImpressions, avgCtr: traffic.avgCtr },
      ctrOpportunities: traffic.opportunities.slice(0, 20),
      cannibalization: cannibalization.slice(0, 10),
    };
  }

  if (area === "health") {
    const [speed, index, crux] = await Promise.all([
      getPageSpeedResults(projectId),
      getIndexStatuses(projectId),
      safe(getCruxHistory(projectId, "PHONE")),
    ]);
    return {
      ...base,
      pageSpeed: speed,
      indexCoverage: index.filter((r) => r.verdict).slice(0, 25),
      coreWebVitalsField: crux?.latest ?? null,
    };
  }

  // onpage
  const target = url?.trim() || `https://${project?.domain.replace(/\/$/, "")}`;
  const report = await auditPage(target);
  return { ...base, onPage: report };
}

const AREA_FOCUS: Record<AssistArea, string> = {
  overview: "Interpret the overall SEO health and trend, then give the 3 most important next actions.",
  insights: "Focus on CTR opportunities (suggest concrete rewritten titles/meta descriptions) and resolving cannibalization (which page should be canonical).",
  health: "Prioritise fixing Core Web Vitals and index-coverage issues with concrete technical steps.",
  onpage: "Produce a precise fix checklist for this page's on-page issues (title, meta, headings, canonical, schema, broken links).",
};

export async function assist(
  area: AssistArea,
  projectId: number,
  question?: string,
  url?: string
): Promise<string> {
  const config = await getAiConfig();
  if (!config) throw new Error("No AI provider is configured. Add an API key first.");

  const data = await gatherAssistData(area, projectId, url);
  const task = question?.trim()
    ? `The user asks: "${question.trim()}"\nAnswer using the data below.`
    : AREA_FOCUS[area];

  const user = `${task}\n\nData currently on the "${area}" tab:\n${JSON.stringify(data, null, 2)}`;
  return complete(config, ASSIST_SYSTEM, user, { maxTokens: 1500 });
}
