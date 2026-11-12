import { describe, expect, it } from "vitest";

import {
  getOpenAiConfig,
  getSupabasePublicConfig,
  hasOpenAiConfig,
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

describe("OpenAI server configuration", () => {
  it("requires both a server key and model without exposing the key", () => {
    expect(hasOpenAiConfig({ OPENAI_API_KEY: "key" })).toBe(false);
    expect(hasOpenAiConfig({ OPENAI_API_KEY: "key", OPENAI_MODEL: "model" })).toBe(true);
    expect(getOpenAiConfig({ OPENAI_API_KEY: "key", OPENAI_MODEL: "model" })).toEqual({
      apiKey: "key",
      model: "model"
    });
    expect(() => getOpenAiConfig({})).toThrow("Missing OpenAI server configuration.");
  });
});
