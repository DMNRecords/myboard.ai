import { describe, expect, it } from "vitest";

import { createPropertyEconomyBlueprint } from "../../src/modules/game-design/domain/property-economy-blueprint";

describe("property economy blueprint", () => {
  it("provides a stable playable inventory instead of asking AI to balance it", () => {
    const blueprint = createPropertyEconomyBlueprint();

    expect(blueprint.board.spaces).toBe(36);
    expect(blueprint.board.cells).toHaveLength(36);
    expect(blueprint.board.cells.filter((cell) => cell.kind === "property")).toHaveLength(22);
    expect(blueprint.board.cells.filter((cell) => cell.kind === "route")).toHaveLength(4);
    expect(blueprint.board.cells.filter((cell) => cell.kind === "utility")).toHaveLength(2);
    expect(blueprint.decks).toHaveLength(2);
    expect(blueprint.decks.every((deck) => deck.cards.length === 16)).toBe(true);
    expect(blueprint.components.playerTokens).toBe(6);
    expect(blueprint.components.minorUpgrades).toBe(66);
    expect(blueprint.components.majorUpgrades).toBe(22);
    expect(
      blueprint.currency.banknotes.reduce((total, banknote) => total + banknote.quantity, 0)
    ).toBe(170);
  });

  it("replaces only theme-facing labels while retaining the component counts", () => {
    const blueprint = createPropertyEconomyBlueprint({
      boardTitle: "Город ветров",
      propertyNames: ["Порт", "Маяк"],
      currencyName: "ветрики",
      currencySymbol: "В"
    });

    expect(blueprint.board.title).toBe("Город ветров");
    expect(blueprint.board.cells.filter((cell) => cell.kind === "property").slice(0, 2)).toEqual([
      expect.objectContaining({ name: "Порт" }),
      expect.objectContaining({ name: "Маяк" })
    ]);
    expect(blueprint.currency).toMatchObject({ name: "ветрики", symbol: "В" });
    expect(blueprint.decks[0]?.cards).toHaveLength(16);
  });
});
