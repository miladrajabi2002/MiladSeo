import { NextRequest, NextResponse } from "next/server";
import { fail, isAuthenticated, ok, serverError, unauthorized } from "@/lib/api";
import {
  clearAiConfig,
  getAiConfig,
  getAiStatus,
  saveAiConfig,
  testConnection,
} from "@/lib/ai";
import type { AiProvider } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET reports the configured AI provider/model (never the stored key). */
export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    return ok(await getAiStatus());
  } catch (error) {
    return serverError(error);
  }
}

interface SaveBody {
  provider?: unknown;
  apiKey?: unknown;
  model?: unknown;
}

/** PUT saves the provider + key, verifying the credentials before storing them. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const body = (await request.json()) as SaveBody;
    const provider = body.provider;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";

    if (provider !== "anthropic" && provider !== "openai") {
      return fail("provider must be 'anthropic' or 'openai'", "VALIDATION_ERROR", 422);
    }
    if (!apiKey) {
      return fail("apiKey is required", "VALIDATION_ERROR", 422);
    }

    const provider2 = provider as AiProvider;
    const defaultModel = provider2 === "anthropic" ? "claude-opus-4-8" : "gpt-4o";
    try {
      await testConnection({ provider: provider2, apiKey, model: model || defaultModel });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      return fail(`Could not connect: ${message}`, "AI_CONNECTION_FAILED", 400);
    }

    await saveAiConfig(provider2, apiKey, model || null);
    return ok(await getAiStatus());
  } catch (error) {
    return serverError(error);
  }
}

/** POST re-tests the currently stored credentials. */
export async function POST(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    const config = await getAiConfig();
    if (!config) return fail("No AI provider configured", "NOT_CONFIGURED", 400);
    await testConnection(config);
    return ok({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed";
    return fail(message, "AI_CONNECTION_FAILED", 400);
  }
}

/** DELETE removes the stored AI credentials. */
export async function DELETE(): Promise<NextResponse> {
  if (!(await isAuthenticated())) return unauthorized();
  try {
    await clearAiConfig();
    return ok({ configured: false, provider: null, model: null });
  } catch (error) {
    return serverError(error);
  }
}
