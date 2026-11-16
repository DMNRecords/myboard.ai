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

  it("keeps the economic game blueprint stable while applying AI theme text", () => {
    const design = parseGeneratedGameDesign(
      `{
        "mode": "property-economy",
        "concept": "Городская инвестиционная игра",
        "objective": "Развить лучшие районы",
        "playerCount": "2–4 игрока",
        "duration": "70 минут",
        "rules": "Покупайте локации, собирайте наборы и улучшайте их.",
        "board": { "title": "Ночной город", "spaces": 8 },
        "propertyNames": ["Район 1", "Район 2"],
        "currency": { "currencyName": "искры", "symbol": "✦" },
        "eventCards": [{ "title": "Огни", "text": "Получите 10 искр." }],
        "opportunityCards": [{ "title": "Инвестиция", "text": "Снизьте стоимость улучшения." }]
      }`
    );

    expect(design.mode).toBe("property-economy");
    expect(design.board?.spaces).toBe(36);
    expect(design.board?.cells).toHaveLength(36);
    expect(design.decks?.map((deck) => deck.cards.length)).toEqual([16, 16]);
    expect(design.economy?.banknotes?.reduce((total, note) => total + note.quantity, 0)).toBe(170);
    expect(design.economy?.currencyName).toBe("искры");
  });

  it("creates a card game without an unused board", () => {
    const design = parseGeneratedGameDesign(
      `{
        "mode": "cards",
        "concept": "Быстрая игра с колодой",
        "objective": "Собрать три комбинации",
        "playerCount": "2–4 игрока",
        "duration": "20 минут",
        "rules": "Берите карты и разыгрывайте эффекты.",
        "cards": [
          { "title": "Импульс", "text": "Возьмите ещё одну карту." },
          { "title": "Обмен", "text": "Поменяйтесь картой с игроком." }
        ],
        "decks": [{
          "title": "Колода действий",
          "purpose": "Комбинации и события",
          "cards": [{ "title": "Импульс", "text": "Возьмите ещё одну карту." }]
        }]
      }`
    );

    expect(design.mode).toBe("cards");
    expect(design.board).toBeUndefined();
    expect(design.decks?.[0]?.title).toBe("Колода действий");
  });

  it("keeps adventure scenario and roles from the AI response", () => {
    const design = parseGeneratedGameDesign(
      `{
        "mode": "adventure",
        "concept": "Командный квест",
        "objective": "Пройти три сцены",
        "playerCount": "3–5 игроков",
        "duration": "45 минут",
        "rules": "Выбирайте действие и решайте испытания.",
        "cards": [{ "title": "След", "text": "Откройте следующую сцену." }],
        "scenario": { "title": "Потерянный маяк", "hook": "Команда ищет сигнал.", "stages": ["Путь", "Испытание", "Финал"] },
        "roles": [{ "name": "Следопыт", "goal": "Найти путь", "ability": "Один раз меняет событие" }]
      }`
    );

    expect(design.mode).toBe("adventure");
    expect(design.scenario?.stages).toHaveLength(3);
    expect(design.roles?.[0]?.name).toBe("Следопыт");
  });
});
