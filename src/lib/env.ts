type Environment = Record<string, string | undefined>;

const requiredEnvironmentVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
] as const;

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type AiProvider = "openai" | "openrouter";
export type ImageProvider = "openai";

function isAiProvider(value: string | undefined): value is AiProvider {
  return value === "openai" || value === "openrouter";
}

function isImageProvider(value: string | undefined): value is ImageProvider {
  return value === "openai";
}

export function hasAiProviderConfig(environment: Environment = process.env): boolean {
  return Boolean(
    isAiProvider(environment.AI_PROVIDER) &&
    environment.AI_API_KEY?.trim() &&
    environment.AI_MODEL?.trim()
  );
}

export function getAiProviderConfig(environment: Environment = process.env): {
  provider: AiProvider;
  apiKey: string;
  model: string;
} {
  if (!hasAiProviderConfig(environment)) {
    throw new Error("Missing AI provider server configuration.");
  }

  return {
    provider: environment.AI_PROVIDER as AiProvider,
    apiKey: environment.AI_API_KEY as string,
    model: environment.AI_MODEL as string
  };
}

export function hasImageProviderConfig(environment: Environment = process.env): boolean {
  return Boolean(
    isImageProvider(environment.IMAGE_PROVIDER) &&
    environment.IMAGE_API_KEY?.trim() &&
    environment.IMAGE_MODEL?.trim()
  );
}

export function getImageProviderConfig(environment: Environment = process.env): {
  provider: ImageProvider;
  apiKey: string;
  model: string;
} {
  if (!hasImageProviderConfig(environment)) {
    throw new Error("Missing image provider server configuration.");
  }

  return {
    provider: environment.IMAGE_PROVIDER as ImageProvider,
    apiKey: environment.IMAGE_API_KEY as string,
    model: environment.IMAGE_MODEL as string
  };
}

export function hasSupabasePublicConfig(environment: Environment = process.env): boolean {
  return requiredEnvironmentVariables.every((name) => Boolean(environment[name]?.trim()));
}

export function getSupabasePublicConfig(
  environment: Environment = process.env
): SupabasePublicConfig {
  const missing = requiredEnvironmentVariables.filter((name) => !environment[name]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    url: environment.NEXT_PUBLIC_SUPABASE_URL as string,
    publishableKey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string
  };
}
