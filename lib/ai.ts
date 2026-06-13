import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { prisma } from "./prisma";
import { getOverviewStats, getMovers } from "./rankings";
import {
  getTraffic,
  getVisibility,
  getCannibalization,
  getPages,
} from "./insights";
import { getPageSpeedResults } from "./pagespeed";
import type { AiAnalysis, AiConfigStatus, AiProvider } from "./types";

const PROVIDER_KEY = "ai_provider";
const APIKEY_KEY = "ai_api_key";
const MODEL_KEY = "ai_model";

const DEFAULT_MODEL: Record<AiProvider, string> = {
  anthropic: "claude-opus-4-8",
  openai: "gpt-4o",
};

interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

function isProvider(value: string | null): value is AiProvider {
  return value === "anthropic" || value === "openai";
}

/** Returns the saved AI config, or null when no key is stored. */
export async function getAiConfig(): Promise<AiConfig | null> {
  const provider = await readSetting(PROVIDER_KEY);
  const apiKey = await readSetting(APIKEY_KEY);
  if (!isProvider(provider) || !apiKey) return null;
  const model = (await readSetting(MODEL_KEY)) || DEFAULT_MODEL[provider];
  return { provider, apiKey, model };
}

/** Connection status for the UI — never exposes the stored key. */
export async function getAiStatus(): Promise<AiConfigStatus> {
  const config = await getAiConfig();
  if (!config) return { configured: false, provider: null, model: null };
  return {
    configured: true,
    provider: config.provider,
    model: config.model,
  };
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

// ---------------------------------------------------------------------------
// Provider calls
// ---------------------------------------------------------------------------

/** A short round-trip used by the "Test connection" button. */
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
  await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: config.model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    },
    { headers: { Authorization: `Bearer ${config.apiKey}` }, timeout: 30_000 }
  );
}

async function complete(config: AiConfig, system: string, user: string): Promise<string> {
  if (config.provider === "anthropic") {
    const client = new Anthropic({ apiKey: config.apiKey });
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: user }],
    });
    return message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }

  const response = await axios.post<{
    choices: { message: { content: string } }[];
  }>(
    "https://api.openai.com/v1/chat/completions",
    {
      model: config.model,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    { headers: { Authorization: `Bearer ${config.apiKey}` }, timeout: 120_000 }
  );
  return response.data.choices[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a world-class technical SEO consultant auditing a website using its Google Search Console data, traffic, Core Web Vitals and on-page signals. Think like a senior SEO strategist: find the highest-leverage opportunities, diagnose risks, and give specific, actionable advice a site owner or web designer can execute.

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
Provide 5-10 prioritized recommendations, ordered most important first. Be specific and reference real numbers from the data. Write user-facing text in the language the keywords are written in (e.g. Persian if keywords are Persian).`;

function buildSnapshot(data: Record<string, unknown>): string {
  return [
    "Here is the Search Console snapshot for the site. Analyse it and respond with the JSON object.",
    "",
    JSON.stringify(data, null, 2),
  ].join("\n");
}

function extractJson(raw: string): AiAnalysis {
  let text = raw.trim();
  // Strip ```json fences if the model added them despite instructions
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The AI response did not contain valid JSON");
  }
  const parsed = JSON.parse(text.slice(start, end + 1)) as AiAnalysis;
  if (typeof parsed.healthScore !== "number" || !Array.isArray(parsed.recommendations)) {
    throw new Error("The AI response was missing required fields");
  }
  return parsed;
}

export async function runAiAnalysis(projectId: number): Promise<AiAnalysis> {
  const config = await getAiConfig();
  if (!config) {
    throw new Error("No AI provider is configured. Add an API key first.");
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const [overview, movers, traffic, visibility, cannibalization, pages, speed] =
    await Promise.all([
      getOverviewStats(projectId),
      getMovers(projectId),
      getTraffic(projectId, 30),
      getVisibility(projectId, 30),
      getCannibalization(projectId),
      getPages(projectId),
      getPageSpeedResults(projectId),
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
        keyword: k.text,
        position: k.desktopPos,
        clicks: k.clicks,
        impressions: k.impressions,
      })),
    },
    visibility: { current: visibility.current, weekChange: visibility.weekChange },
    traffic: {
      totalClicks: traffic.totalClicks,
      totalImpressions: traffic.totalImpressions,
      avgCtr: traffic.avgCtr,
      ctrOpportunities: traffic.opportunities.slice(0, 15).map((o) => ({
        keyword: o.text,
        position: o.position,
        impressions: o.impressions,
        ctr: o.ctr,
        expectedCtr: o.expectedCtr,
      })),
    },
    movers: {
      improved: movers.improved.slice(0, 10).map((m) => ({ keyword: m.text, delta: m.delta, nowPos: m.nowPos })),
      dropped: movers.dropped.slice(0, 10).map((m) => ({ keyword: m.text, delta: m.delta, nowPos: m.nowPos })),
    },
    cannibalization: cannibalization.slice(0, 8).map((g) => ({
      keyword: g.text,
      competingPages: g.pages.map((p) => ({ url: p.urlPath, position: p.position })),
    })),
    topPages: pages.slice(0, 10).map((p) => ({
      url: p.urlPath,
      keywords: p.keywordCount,
      bestPosition: p.bestPosition,
      clicks: p.clicks,
      impressions: p.impressions,
    })),
    coreWebVitals: speed.map((s) => ({
      url: s.urlPath,
      strategy: s.strategy,
      score: s.score,
      lcpMs: s.lcpMs,
      cls: s.cls,
      inpMs: s.inpMs,
    })),
  };

  const raw = await complete(config, SYSTEM_PROMPT, buildSnapshot(snapshot));
  const analysis = extractJson(raw);
  return {
    ...analysis,
    generatedAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
  };
}
