import type { GameDesign } from "@/modules/game-design/domain/game-design";

export type PrintProfile = {
  id: "a4-home" | "a4-large-board";
  name: string;
  pageSize: "A4";
  safeMarginMm: number;
  bleedMm: number;
  cardColumns: number;
  boardTiles: { columns: number; rows: number; boardSizeMm: number };
};

export const a4HomePrintProfile: PrintProfile = {
  id: "a4-home",
  name: "A4 для домашней печати",
  pageSize: "A4",
  safeMarginMm: 10,
  bleedMm: 3,
  cardColumns: 2,
  boardTiles: { columns: 1, rows: 1, boardSizeMm: 190 }
};

export const a4LargeBoardPrintProfile: PrintProfile = {
  id: "a4-large-board",
  name: "Большое поле 50 × 50 см (6 листов A4)",
  pageSize: "A4",
  safeMarginMm: 10,
  bleedMm: 3,
  cardColumns: 2,
  boardTiles: { columns: 3, rows: 2, boardSizeMm: 500 }
};

export type PrintValidation = {
  isPrintable: boolean;
  issues: string[];
};

export function validatePrintableGame(design: GameDesign): PrintValidation {
  const issues: string[] = [];

  if (!design.board.title.trim()) {
    issues.push("У поля должно быть название.");
  }

  if (design.board.spaces < 8 || design.board.spaces > 60) {
    issues.push("Поле должно содержать от 8 до 60 клеток.");
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
  const boardSheets = profile.boardTiles.columns * profile.boardTiles.rows;
  return 1 + boardSheets + Math.ceil(design.cards.length / cardsPerSheet);
}
