import { describe, expect, it } from "vitest";

import {
  getAiProviderConfig,
  getSupabasePublicConfig,
  hasAiProviderConfig,
  hasSupabasePublicConfig
} from "../../src/lib/env";

describe("getSupabasePublicConfig", () => {
  it("returns public Supabase configuration when both values are present", () => {
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key"
      })
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key"
    });
  });

  it("reports every missing required value without exposing any values", () => {
    expect(() => getSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: "" })).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  });

  it("reports whether the public Supabase configuration is complete", () => {
    expect(
      hasSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" })
    ).toBe(false);
    expect(
      hasSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key"
      })
    ).toBe(true);
  });
});

describe("AI provider server configuration", () => {
  it("requires a supported provider, server key and model without exposing the key", () => {
    expect(hasAiProviderConfig({ AI_PROVIDER: "openrouter", AI_API_KEY: "key" })).toBe(false);
    expect(
      hasAiProviderConfig({
        AI_PROVIDER: "openrouter",
        AI_API_KEY: "key",
        AI_MODEL: "openrouter/free"
      })
    ).toBe(true);
    expect(
      getAiProviderConfig({
        AI_PROVIDER: "openrouter",
        AI_API_KEY: "key",
        AI_MODEL: "openrouter/free"
      })
    ).toEqual({
      provider: "openrouter",
      apiKey: "key",
      model: "openrouter/free"
    });
    expect(() => getAiProviderConfig({})).toThrow("Missing AI provider server configuration.");
  });
});
