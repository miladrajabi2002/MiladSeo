import axios from "axios";
import { prisma } from "./prisma";
import type { KeywordIdea, KeywordResearch } from "./types";

const ENDPOINT = "https://suggestqueries.google.com/complete/search";

// Maps a project location to Google's language + country hints
const LOCALE: Record<string, { hl: string; gl: string }> = {
  Iran: { hl: "fa", gl: "ir" },
  UAE: { hl: "ar", gl: "ae" },
  "Saudi Arabia": { hl: "ar", gl: "sa" },
  Egypt: { hl: "ar", gl: "eg" },
  UK: { hl: "en", gl: "gb" },
  USA: { hl: "en", gl: "us" },
  Other: { hl: "en", gl: "us" },
};

// Modifiers fanned out around the seed to surface long-tail + question queries
const EN_MODIFIERS = ["how", "what", "best", "vs", "for", "price", "buy", "free", "near me"];
const FA_MODIFIERS = ["بهترین", "قیمت", "خرید", "چیست", "آموزش", "رایگان", "چگونه"];

const QUESTION_WORDS = [
  "how", "what", "why", "when", "where", "which", "who", "can", "is", "are",
  "چطور", "چگونه", "چیست", "چرا", "آیا", "کدام", "کجا",
];

function isQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return QUESTION_WORDS.some((w) => lower.startsWith(`${w} `) || lower.includes(`${w} `));
}

async function fetchSuggestions(
  query: string,
  hl: string,
  gl: string
): Promise<string[]> {
  try {
    // Read raw bytes and decode as UTF-8 so non-Latin (Persian/Arabic)
    // suggestions don't get mangled by a wrong response charset.
    const response = await axios.get<ArrayBuffer>(ENDPOINT, {
      params: { client: "firefox", q: query, hl, gl, ie: "UTF-8", oe: "UTF-8" },
      timeout: 12_000,
      responseType: "arraybuffer",
    });
    const text = new TextDecoder("utf-8").decode(new Uint8Array(response.data));
    const parsed = JSON.parse(text) as [string, string[]];
    return Array.isArray(parsed?.[1]) ? parsed[1] : [];
  } catch {
    return [];
  }
}

/**
 * Expands a seed keyword into related queries using Google Autocomplete
 * (free, no API key). Fans the seed out across question + commercial
 * modifiers and dedupes the suggestions.
 */
export async function researchKeywords(
  projectId: number,
  seed: string
): Promise<KeywordResearch> {
  const trimmed = seed.trim();
  if (!trimmed) throw new Error("Enter a seed keyword");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const { hl, gl } = LOCALE[project?.location ?? "Other"] ?? LOCALE.Other;

  const modifiers = hl === "fa" || hl === "ar" ? FA_MODIFIERS : EN_MODIFIERS;
  const queries = [
    trimmed,
    ...modifiers.map((m) => (hl === "fa" || hl === "ar" ? `${m} ${trimmed}` : `${trimmed} ${m}`)),
  ];

  const batches = await Promise.all(queries.map((q) => fetchSuggestions(q, hl, gl)));

  const seen = new Set<string>();
  const ideas: KeywordIdea[] = [];
  for (const list of batches) {
    for (const text of list) {
      const key = text.trim().toLowerCase();
      if (!key || key === trimmed.toLowerCase() || seen.has(key)) continue;
      seen.add(key);
      ideas.push({ text: text.trim(), words: text.trim().split(/\s+/).length, question: isQuestion(text) });
    }
  }

  // Already-tracked keywords for this seed so users can spot gaps
  const tracked = await prisma.keyword.findMany({
    where: { projectId, text: { contains: trimmed } },
    select: { text: true },
    distinct: ["text"],
  });
  const trackedSet = new Set(tracked.map((k) => k.text.toLowerCase()));
  for (const idea of ideas) {
    idea.tracked = trackedSet.has(idea.text.toLowerCase());
  }

  ideas.sort((a, b) => Number(b.question) - Number(a.question) || a.words - b.words);

  return {
    seed: trimmed,
    locale: `${hl}-${gl}`,
    total: ideas.length,
    ideas: ideas.slice(0, 100),
  };
}
