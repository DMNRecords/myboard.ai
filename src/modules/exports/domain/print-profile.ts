import {
  getGameDecks,
  hasGameBoard,
  isPropertyEconomyGame,
  type GameDesign
} from "../../game-design/domain/game-design";
import { createPropertyEconomyBlueprint } from "../../game-design/domain/property-economy-blueprint";

export type PrintProfile = {
  id: "a4-home" | "a4-large-board" | "a2-compact" | "a1-standard" | "a0-showcase";
  name: string;
  pageSize: "A4" | "A2" | "A1" | "A0";
  orientation: "portrait" | "landscape";
  pageWidthMm: number;
  pageHeightMm: number;
  safeMarginMm: number;
  bleedMm: number;
  cardColumns: number;
  boardTiles: { columns: number; rows: number; boardSizeMm: number };
};

export const a4HomePrintProfile: PrintProfile = {
  id: "a4-home",
  name: "A4 для домашней печати",
  pageSize: "A4",
  orientation: "portrait",
  pageWidthMm: 210,
  pageHeightMm: 297,
  safeMarginMm: 10,
  bleedMm: 3,
  cardColumns: 2,
  boardTiles: { columns: 1, rows: 1, boardSizeMm: 190 }
};

export const a4LargeBoardPrintProfile: PrintProfile = {
  id: "a4-large-board",
  name: "Большое поле 50 × 50 см (6 листов A4)",
  pageSize: "A4",
  orientation: "portrait",
  pageWidthMm: 210,
  pageHeightMm: 297,
  safeMarginMm: 10,
  bleedMm: 3,
  cardColumns: 2,
  boardTiles: { columns: 3, rows: 2, boardSizeMm: 500 }
};

export const a2CompactPrintProfile: PrintProfile = {
  id: "a2-compact",
  name: "Компактный типографский комплект A2 · 40 × 40 см",
  pageSize: "A2",
  orientation: "landscape",
  pageWidthMm: 594,
  pageHeightMm: 420,
  safeMarginMm: 5,
  bleedMm: 3,
  cardColumns: 4,
  boardTiles: { columns: 1, rows: 1, boardSizeMm: 400 }
};

export const a1StandardPrintProfile: PrintProfile = {
  id: "a1-standard",
  name: "Стандартный типографский комплект A1 · 50 × 50 см",
  pageSize: "A1",
  orientation: "landscape",
  pageWidthMm: 841,
  pageHeightMm: 594,
  safeMarginMm: 5,
  bleedMm: 3,
  cardColumns: 5,
  boardTiles: { columns: 1, rows: 1, boardSizeMm: 500 }
};

export const a0ShowcasePrintProfile: PrintProfile = {
  id: "a0-showcase",
  name: "Большой выставочный комплект A0 · 70 × 70 см",
  pageSize: "A0",
  orientation: "landscape",
  pageWidthMm: 1189,
  pageHeightMm: 841,
  safeMarginMm: 5,
  bleedMm: 3,
  cardColumns: 7,
  boardTiles: { columns: 1, rows: 1, boardSizeMm: 700 }
};

export const printProfiles = [
  a4HomePrintProfile,
  a4LargeBoardPrintProfile,
  a2CompactPrintProfile,
  a1StandardPrintProfile,
  a0ShowcasePrintProfile
] as const;

export function getPrintProfile(value: string | undefined): PrintProfile {
  return printProfiles.find((profile) => profile.id === value) ?? a4HomePrintProfile;
}

export type PrintManifestItem = {
  id: string;
  name: string;
  quantity: number;
  size: string;
  paper: string;
  note: string;
};

export function getPropertyEconomyPrintManifest(
  design: GameDesign,
  profile: PrintProfile
): PrintManifestItem[] {
  const propertyNames = design.board?.cells
    ?.filter((cell) => cell.kind === "property")
    .map((cell) => cell.name);
  const blueprint = createPropertyEconomyBlueprint({
    boardTitle: design.board?.title,
    propertyNames: propertyNames?.length === 22 ? propertyNames : undefined,
    currencyName: design.economy?.currencyName,
    currencySymbol: design.economy?.symbol
  });

  return blueprint.printComponents.map((item) =>
    item.id === "board"
      ? {
          ...item,
          size:
            profile.id === "a4-large-board"
              ? `${profile.boardTiles.boardSizeMm} × ${profile.boardTiles.boardSizeMm} мм, склейка ${profile.boardTiles.columns} × ${profile.boardTiles.rows} листов A4`
              : `${profile.boardTiles.boardSizeMm} × ${profile.boardTiles.boardSizeMm} мм на ${profile.pageSize}`,
          note: `Вылет ${profile.bleedMm} мм, безопасная зона ${profile.safeMarginMm} мм`
        }
      : item
  );
}

export type PrintValidation = {
  isPrintable: boolean;
  issues: string[];
};

export function validatePrintableGame(design: GameDesign): PrintValidation {
  const issues: string[] = [];

  if (hasGameBoard(design)) {
    if (!design.board.title.trim()) {
      issues.push("У поля должно быть название.");
    }

    if (design.board.spaces < 8 || design.board.spaces > 60) {
      issues.push("Поле должно содержать от 8 до 60 клеток.");
    }
  }

  if (isPropertyEconomyGame(design)) {
    if (!design.board || design.board.spaces !== 36 || design.board.cells?.length !== 36) {
      issues.push("Экономической игре нужны все 36 клеток поля.");
    }

    if (design.decks?.length !== 2 || design.decks.some((deck) => deck.cards.length !== 16)) {
      issues.push("Экономической игре нужны две колоды по 16 карточек.");
    }

    if (!design.economy?.banknotes?.length) {
      issues.push("Добавьте набор банкнот для печатного комплекта.");
    }
  }

  if (design.cards.length === 0) {
    issues.push("Добавьте хотя бы одну карточку.");
  }

  for (const card of design.cards) {
    if (!card.title.trim() || !card.text.trim()) {
      issues.push("У каждой карточки должны быть название и текст.");
      break;
    }
  }

  return { isPrintable: issues.length === 0, issues };
}

export function getPrintSheetCount(design: GameDesign, profile = a4HomePrintProfile): number {
  const cardsPerSheet = profile.cardColumns * 3;
  const boardSheets = hasGameBoard(design)
    ? profile.boardTiles.columns * profile.boardTiles.rows
    : 0;

  if (isPropertyEconomyGame(design)) {
    const banknotes =
      design.economy?.banknotes?.reduce((total, banknote) => total + banknote.quantity, 0) ?? 0;
    const upgrades = (design.economy?.minorUpgrades ?? 0) + (design.economy?.majorUpgrades ?? 0);
    const moneyPerSheet =
      profile.id === "a0-showcase"
        ? 72
        : profile.id === "a1-standard"
          ? 48
          : profile.id === "a2-compact"
            ? 24
            : 8;
    const deckSheets = getGameDecks(design).reduce(
      (total, deck) => total + Math.ceil(deck.cards.length / cardsPerSheet),
      0
    );

    return (
      5 +
      boardSheets +
      deckSheets +
      Math.ceil(22 / cardsPerSheet) +
      Math.ceil(banknotes / moneyPerSheet) +
      Math.ceil(upgrades / 40) +
      1
    );
  }

  return 1 + boardSheets + Math.ceil(design.cards.length / cardsPerSheet);
}
