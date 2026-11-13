import "server-only";

import { getImageProviderConfig } from "@/lib/env";

export class ImageProviderRequestError extends Error {
  constructor(public readonly status: number) {
    super("Image provider request failed.");
  }
}

type ImageResponse = { data?: Array<{ b64_json?: unknown }> };

export async function generateGameVisual(prompt: string): Promise<Uint8Array> {
  const config = getImageProviderConfig();

  if (config.provider === "cloudflare") {
    return generateCloudflareGameVisual({
      prompt,
      apiKey: config.apiKey,
      model: config.model,
      accountId: config.cloudflareAccountId as string
    });
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
      moderation: "auto"
    })
  });
  const payload = (await response.json()) as ImageResponse;
  const encoded = payload.data?.[0]?.b64_json;

  if (!response.ok || typeof encoded !== "string" || !encoded) {
    throw new ImageProviderRequestError(response.status);
  }

  return Uint8Array.from(Buffer.from(encoded, "base64"));
}

async function generateCloudflareGameVisual(input: {
  prompt: string;
  apiKey: string;
  model: string;
  accountId: string;
}): Promise<Uint8Array> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(input.accountId)}/ai/run/${encodeURIComponent(input.model)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: input.prompt,
        width: 1024,
        height: 1024,
        num_steps: 6
      })
    }
  );

  if (!response.ok) {
    throw new ImageProviderRequestError(response.status);
  }

  return new Uint8Array(await response.arrayBuffer());
}
