import { describe, expect, it } from "vitest";

import {
  createGameDesignerInstructions,
  normalizeChatPrompt
} from "../../src/modules/ai/domain/chat";

describe("AI chat domain", () => {
  it("normalizes a project prompt and keeps it bounded", () => {
    expect(normalizeChatPrompt("  Придумай механику  ")).toBe("Придумай механику");
    expect(() => normalizeChatPrompt(" ")).toThrow("Chat message must not be empty.");
    expect(() => normalizeChatPrompt("a".repeat(2001))).toThrow(
      "Chat message must not exceed 2000 characters."
    );
  });

  it("builds original-design instructions scoped to the project", () => {
    const instructions = createGameDesignerInstructions("Темиртау");

    expect(instructions).toContain("Темиртау");
    expect(instructions).toContain("do not copy protected games");
  });
});
