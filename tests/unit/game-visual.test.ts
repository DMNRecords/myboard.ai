import { describe, expect, it } from "vitest";

import {
  buildGameVisualPrompt,
  isGameVisualKind
} from "../../src/modules/assets/domain/game-visual";
import { temirtauGameTemplate } from "../../src/modules/game-design/domain/game-design";

describe("game visual prompt", () => {
  it("uses the selected visual kind and preserves the original-game guardrails", () => {
    const prompt = buildGameVisualPrompt({
      kind: "board",
      projectTitle: "Темиртау после дождя",
      projectIdea: "Городская нуарная игра",
      style: "noir",
      design: temirtauGameTemplate
    });

    expect(prompt).toContain("top-down illustrated game board");
    expect(prompt).toContain("Visual style: noir");
    expect(prompt).toContain("Do not recreate Monopoly");
    expect(prompt).toContain("Do not include readable text");
  });

  it("allows only supported product visual kinds", () => {
    expect(isGameVisualKind("cover")).toBe(true);
    expect(isGameVisualKind("cards")).toBe(true);
    expect(isGameVisualKind("poster")).toBe(false);
  });
});
