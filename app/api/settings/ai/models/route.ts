import { NextRequest, NextResponse } from "next/server";
import { fail, isAuthenticated, ok, unauthorized } from "@/lib/api";
import { getAiConfig, isProvider, listModels } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** GET lists models using the already-stored key (to change model later). */
export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const config = await getAiConfig();
    if (!config) return fail("No AI provider configured", "NOT_CONFIGURED", 400);
    const models = await listModels(config.provider, config.apiKey);
    return ok({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load models";
    return fail(message, "MODELS_FAILED", 400);
  }
}

interface Body {
  provider?: unknown;
  apiKey?: unknown;
}

/**
 * POST returns the selectable model ids for a provider, using the supplied
 * key — used to populate the model dropdown before saving.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const body = (await request.json()) as Body;
    const provider = body.provider;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!isProvider(provider)) {
      return fail("Invalid provider", "VALIDATION_ERROR", 422);
    }
    if (!apiKey) {
      return fail("apiKey is required", "VALIDATION_ERROR", 422);
    }
    const models = await listModels(provider, apiKey);
    return ok({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load models";
    return fail(message, "MODELS_FAILED", 400);
  }
}
