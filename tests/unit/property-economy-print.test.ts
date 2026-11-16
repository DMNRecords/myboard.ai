import { describe, expect, it } from "vitest";

import { createEditableStarterGame } from "../../src/modules/ai/domain/game-generation";
import {
  a1StandardPrintProfile,
  getPrintProfile,
  getPrintSheetCount,
  getPropertyEconomyPrintManifest,
  validatePrintableGame
} from "../../src/modules/exports/domain/print-profile";

describe("property economy print kit", () => {
  const design = createEditableStarterGame({
    projectTitle: "Город ветров",
    idea: "Экономическая игра о городе",
    language: "ru",
    mode: "property-economy"
  });

  it("offers a real large-format A1 profile", () => {
    expect(getPrintProfile("a1-standard")).toEqual(a1StandardPrintProfile);
    expect(a1StandardPrintProfile.boardTiles).toEqual({ columns: 1, rows: 1, boardSizeMm: 500 });
  });

  it("creates an exact printer manifest from the same game data", () => {
    const manifest = getPropertyEconomyPrintManifest(design, a1StandardPrintProfile);

    expect(validatePrintableGame(design)).toEqual({ isPrintable: true, issues: [] });
    expect(manifest.find((item) => item.id === "board")).toMatchObject({
      quantity: 1,
      size: "500 × 500 мм на A1"
    });
    expect(manifest.find((item) => item.id === "banknotes")).toMatchObject({ quantity: 170 });
    expect(getPrintSheetCount(design, a1StandardPrintProfile)).toBeGreaterThan(1);
  });
});
