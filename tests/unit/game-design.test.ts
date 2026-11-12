import { describe, expect, it } from "vitest";

import {
  createGameDesign,
  parseAssets,
  parseCards,
  temirtauGameTemplate
} from "../../src/modules/game-design/domain/game-design";
import {
  a4LargeBoardPrintProfile,
  getPrintSheetCount,
  validatePrintableGame
} from "../../src/modules/exports/domain/print-profile";
import { getPdfExportEntitlement } from "../../src/modules/exports/domain/export-entitlement";

describe("game design domain", () => {
  it("provides an original Temirtau template with a board and cards", () => {
    expect(temirtauGameTemplate.board.spaces).toBe(24);
    expect(temirtauGameTemplate.cards).toHaveLength(3);
    expect(temirtauGameTemplate.concept).toContain("Темиртау");
  });

  it("creates a validated game design from editor fields", () => {
    expect(
      createGameDesign({
        concept: "Игра о городе",
        objective: "Дойти до финала",
        playerCount: "2–4",
        duration: "30 минут",
        rules: "Бросайте кубик и выполняйте действие клетки.",
        boardTitle: "Маршрут",
        boardSpaces: "18",
        cards: "Факт | Расскажите историю\nСобытие | Передвиньтесь вперёд",
        assets: "Панорама | https://example.com/panorama.jpg | Обложка игры"
      })
    ).toMatchObject({
      schemaVersion: 1,
      board: { title: "Маршрут", spaces: 18 },
      cards: [
        { id: "card-1", category: "event" },
        { id: "card-2", category: "knowledge" }
      ],
      assets: [{ id: "asset-1", title: "Панорама" }]
    });
  });

  it("does not allow an invalid board or an empty card list", () => {
    expect(() => parseCards("\n")).toThrow("Cards must include at least one card.");
    expect(() =>
      createGameDesign({
        concept: "Игра",
        objective: "Победить",
        playerCount: "2",
        duration: "20 минут",
        rules: "Правила",
        boardTitle: "Поле",
        boardSpaces: "4",
        cards: "Карточка | Текст",
        assets: ""
      })
    ).toThrow("Board must have between 8 and 60 spaces.");
  });

  it("accepts web image resources and rejects other protocols", () => {
    expect(parseAssets("Фото | https://example.com/photo.jpg | Для карточки")).toMatchObject([
      { title: "Фото", url: "https://example.com/photo.jpg" }
    ]);
    expect(() => parseAssets("Файл | file:///private/photo.jpg | Нельзя")).toThrow(
      "Asset URL must use HTTP or HTTPS."
    );
  });

  it("validates a complete game for the A4 print profile", () => {
    expect(validatePrintableGame(temirtauGameTemplate)).toEqual({
      isPrintable: true,
      issues: []
    });
    expect(getPrintSheetCount(temirtauGameTemplate)).toBe(3);
    expect(getPrintSheetCount(temirtauGameTemplate, a4LargeBoardPrintProfile)).toBe(8);
  });

  it("keeps PDF downloads server-gated before billing is connected", () => {
    expect(getPdfExportEntitlement([])).toEqual({
      canDownloadPdf: false,
      reason: "paymentRequired"
    });
    expect(
      getPdfExportEntitlement([
        { status: "active", startsAt: new Date("2026-01-01"), expiresAt: null }
      ])
    ).toEqual({ canDownloadPdf: true });
  });
});
