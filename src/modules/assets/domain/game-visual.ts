import type { GameDesign } from "@/modules/game-design/domain/game-design";

export const gameVisualKinds = ["cover", "box", "board", "cards", "tokens", "currency"] as const;
export type GameVisualKind = (typeof gameVisualKinds)[number];
export const dailyImageLimit = 10;

export function isGameVisualKind(value: string): value is GameVisualKind {
  return gameVisualKinds.some((kind) => kind === value);
}

export function getInitialGameVisualKinds(input: {
  idea: string;
  design: GameDesign;
}): GameVisualKind[] {
  const source = `${input.idea} ${input.design.concept} ${input.design.rules}`.toLocaleLowerCase(
    "ru-RU"
  );
  const isCardGame = /карточн(ая|ый|ые)? игра|игральн|покер|колод|card game/.test(
    input.idea.toLocaleLowerCase("ru-RU")
  );
  const usesCurrency = /валют|деньг|монет|банк|экономик|торгов/.test(source);

  if (isCardGame) {
    return ["cover", "box", "cards", "tokens"];
  }

  return usesCurrency
    ? ["cover", "box", "board", "cards", "tokens", "currency"]
    : ["cover", "box", "board", "cards", "tokens"];
}

export function buildGameVisualPrompt(input: {
  kind: GameVisualKind;
  projectTitle: string;
  projectIdea: string | null;
  style: string | null;
  design: GameDesign;
}): string {
  const subject: Record<GameVisualKind, string> = {
    board: "a top-down illustrated game board with a unique route and game spaces",
    box: "an original premium board game box cover mockup",
    cards: "a coordinated set of original illustrated game cards arranged as a product spread",
    cover: "an original cinematic cover illustration for the board game",
    currency: "a set of original game banknotes, coins, and resource markers laid out for print",
    tokens: "a coordinated set of original player tokens, dice, trackers, and component markers"
  };

  return [
    `Create ${subject[input.kind]} for an original board game project.`,
    `Project title: ${input.projectTitle}. Concept: ${input.design.concept}.`,
    `User idea: ${input.projectIdea ?? "not provided"}. Visual style: ${input.style ?? "classic"}.`,
    "Use one coherent art direction across every asset: consistent palette, materials, iconography, and mood.",
    "Make it print-ready, detailed, polished, and family-friendly unless the idea clearly requests a permitted different tone.",
    "Do not include readable text, logos, trademarks, celebrity likenesses, copyrighted characters, or a copied board-game layout.",
    "Do not recreate Monopoly or any other protected game's trade dress, board arrangement, names, or components."
  ].join("\n");
}
