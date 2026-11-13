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
