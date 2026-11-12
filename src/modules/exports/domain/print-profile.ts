import type { GameDesign } from "@/modules/game-design/domain/game-design";

export type PrintProfile = {
  id: "a4-home";
  name: string;
  pageSize: "A4";
  safeMarginMm: number;
  bleedMm: number;
  cardColumns: number;
};

export const a4HomePrintProfile: PrintProfile = {
  id: "a4-home",
  name: "A4 для домашней печати",
  pageSize: "A4",
  safeMarginMm: 10,
  bleedMm: 3,
  cardColumns: 2
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
  return 2 + Math.ceil(design.cards.length / cardsPerSheet);
}
