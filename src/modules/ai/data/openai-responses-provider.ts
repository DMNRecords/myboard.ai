import "server-only";

import { getAiProviderConfig, getImageProviderConfig, hasImageProviderConfig } from "@/lib/env";

type OpenAiResponse = { output_text?: unknown };
type OpenRouterResponse = { choices?: Array<{ message?: { content?: unknown } }> };
type CloudflareResponse = {
  result?: { response?: unknown };
};

export class AiProviderRequestError extends Error {
  constructor(public readonly status: number) {
    super("AI provider request failed.");
  }
}

function shouldUseCloudflareFallback(status: number): boolean {
  return status === 402 || status === 408 || status === 429 || status >= 500;
}

export async function generateCloudflareGameDesignerReply(input: {
  instructions: string;
  message: string;
}): Promise<string | null> {
  if (!hasImageProviderConfig()) {
    return null;
  }

  const imageConfig = getImageProviderConfig();

  if (imageConfig.provider !== "cloudflare" || !imageConfig.cloudflareAccountId) {
    return null;
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${imageConfig.cloudflareAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8`,
    {
      method: "POST",
      signal: AbortSignal.timeout(35_000),
      headers: {
        Authorization: `Bearer ${imageConfig.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: input.instructions },
          { role: "user", content: input.message }
        ],
        max_tokens: 700,
        temperature: 0.45
      })
    }
  );
  const payload = (await response.json()) as CloudflareResponse;
  const output = payload.result?.response;

  if (!response.ok || typeof output !== "string" || !output.trim()) {
    throw new AiProviderRequestError(response.status);
  }

  return output.trim();
}

export async function generateGameDesignerReply(input: {
  instructions: string;
  message: string;
}): Promise<string> {
  const config = getAiProviderConfig();

  // `openrouter/free` can spend most of a server-action window waiting for an
  // available upstream model. When Workers AI is already configured for
  // visuals, prefer its low-latency text model for the temporary free mode.
  if (config.provider === "openrouter" && config.model === "openrouter/free") {
    const cloudflareReply = await generateCloudflareGameDesignerReply(input);

    if (cloudflareReply) {
      return cloudflareReply;
    }
  }

  const request =
    config.provider === "openrouter"
      ? {
          endpoint: "https://openrouter.ai/api/v1/chat/completions",
          body: {
            model: config.model,
            messages: [
              { role: "system", content: input.instructions },
              { role: "user", content: input.message }
            ],
            max_tokens: 700
          }
        }
      : {
          endpoint: "https://api.openai.com/v1/responses",
          body: {
            model: config.model,
            instructions: input.instructions,
            input: input.message,
            max_output_tokens: 700,
            store: false
          }
        };
  let response: Response;

  try {
    response = await fetch(request.endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(35_000),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request.body)
    });
  } catch {
    if (config.provider === "openrouter") {
      const fallback = await generateCloudflareGameDesignerReply(input);

      if (fallback) {
        return fallback;
      }
    }

    throw new AiProviderRequestError(503);
  }

  const payload = (await response.json()) as
    | (OpenAiResponse & { error?: { message?: string } })
    | (OpenRouterResponse & { error?: { message?: string } });
  const output =
    config.provider === "openrouter"
      ? (payload as OpenRouterResponse).choices?.[0]?.message?.content
      : (payload as OpenAiResponse).output_text;

  if (response.ok && typeof output === "string" && output.trim()) {
    return output.trim();
  }

  if (config.provider === "openrouter" && shouldUseCloudflareFallback(response.status)) {
    const fallback = await generateCloudflareGameDesignerReply(input);

    if (fallback) {
      return fallback;
    }
  }

  throw new AiProviderRequestError(response.status);
}
