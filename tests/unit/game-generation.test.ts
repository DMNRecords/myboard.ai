import { describe, expect, it } from "vitest";

import {
  createFirstGameInstructions,
  parseGeneratedGameDesign
} from "../../src/modules/ai/domain/game-generation";

describe("first game generation", () => {
  it("requires original structured output and avoids unverified city facts", () => {
    const instructions = createFirstGameInstructions({
      projectTitle: "Темиртау ночью",
      idea: "Игра о городе в стиле нуар",
      style: "noir",
      language: "ru"
    });

    expect(instructions).toContain("Do not copy Monopoly");
    expect(instructions).toContain("Do not present unverified street names");
  });

  it("parses a JSON game response into the validated game schema", () => {
    const design = parseGeneratedGameDesign(
      `Here is the result:\n{\n  "concept": "Ночная городская игра",\n  "objective": "Собрать три истории",\n  "playerCount": "2–4",\n  "duration": "35 минут",\n  "rules": "Бросайте кубик и выполняйте действие клетки.",\n  "board": { "title": "Ночной маршрут", "spaces": 24 },\n  "cards": [\n    { "title": "Городской свет", "text": "Получите жетон истории." },\n    { "title": "Тайный двор", "text": "Передвиньтесь на две клетки." }\n  ]\n}`
    );

    expect(design.board).toEqual({ title: "Ночной маршрут", spaces: 24 });
    expect(design.cards).toHaveLength(2);
  });
});
