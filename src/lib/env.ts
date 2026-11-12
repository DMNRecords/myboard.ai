type Environment = Record<string, string | undefined>;

const requiredEnvironmentVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
] as const;

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

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
