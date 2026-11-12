import "server-only";

import { getOpenAiConfig } from "@/lib/env";

type OpenAiResponse = { output_text?: unknown };

export async function generateGameDesignerReply(input: {
  instructions: string;
  message: string;
}): Promise<string> {
  const config = getOpenAiConfig();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      instructions: input.instructions,
      input: input.message,
      max_output_tokens: 600,
      store: false
    })
  });

  const payload = (await response.json()) as OpenAiResponse & { error?: { message?: string } };

  if (!response.ok || typeof payload.output_text !== "string" || !payload.output_text.trim()) {
    throw new Error(payload.error?.message || "OpenAI did not return a text response.");
  }

  return payload.output_text.trim();
}
