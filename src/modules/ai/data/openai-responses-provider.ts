import "server-only";

import { getAiProviderConfig } from "@/lib/env";

type OpenAiResponse = { output_text?: unknown };
type OpenRouterResponse = { choices?: Array<{ message?: { content?: unknown } }> };

export class AiProviderRequestError extends Error {
  constructor(public readonly status: number) {
    super("AI provider request failed.");
  }
}

export async function generateGameDesignerReply(input: {
  instructions: string;
  message: string;
}): Promise<string> {
  const config = getAiProviderConfig();
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
            max_tokens: 1200
          }
        }
      : {
          endpoint: "https://api.openai.com/v1/responses",
          body: {
            model: config.model,
            instructions: input.instructions,
            input: input.message,
            max_output_tokens: 1200,
            store: false
          }
        };
  const response = await fetch(request.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request.body)
  });

  const payload = (await response.json()) as
    | (OpenAiResponse & { error?: { message?: string } })
    | (OpenRouterResponse & { error?: { message?: string } });
  const output =
    config.provider === "openrouter"
      ? (payload as OpenRouterResponse).choices?.[0]?.message?.content
      : (payload as OpenAiResponse).output_text;

  if (!response.ok || typeof output !== "string" || !output.trim()) {
    throw new AiProviderRequestError(response.status);
  }

  return output.trim();
}
