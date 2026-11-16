import {
  getGameMode,
  isPropertyEconomyGame,
  type GameDesign,
  type GameMode
} from "../../game-design/domain/game-design";

export const gameVisualKinds = ["cover", "box", "board", "cards", "tokens", "currency"] as const;
export type GameVisualKind = (typeof gameVisualKinds)[number];
export const dailyImageLimit = 10;

export function isGameVisualKind(value: string): value is GameVisualKind {
  return gameVisualKinds.some((kind) => kind === value);
}

export function getAvailableVisualKinds(mode: GameMode): GameVisualKind[] {
  if (mode === "property-economy") {
    return ["cover", "box", "board", "cards", "tokens", "currency"];
  }

  if (mode === "cards" || mode === "adventure" || mode === "party") {
    return ["cover", "box", "cards", "tokens"];
  }

  return mode === "strategy"
    ? ["cover", "box", "board", "cards", "tokens", "currency"]
    : ["cover", "box", "board", "cards", "tokens"];
}

export function getInitialGameVisualKinds(input: {
  idea: string;
  design: GameDesign;
  mode?: GameMode | undefined;
}): GameVisualKind[] {
  if (isPropertyEconomyGame(input.design)) {
    return getAvailableVisualKinds("property-economy");
  }

  const source = `${input.idea} ${input.design.concept} ${input.design.rules}`.toLocaleLowerCase(
    "ru-RU"
  );
  const mode = input.mode ?? getGameMode(input.design);
  const isCardGame =
    mode === "cards" ||
    /карточн(ая|ый|ые)? игра|игральн|покер|колод|card game/.test(
      input.idea.toLocaleLowerCase("ru-RU")
    );
  const usesCurrency = /валют|деньг|монет|банк|экономик|торгов/.test(source);

  if (isCardGame) {
    return getAvailableVisualKinds("cards");
  }

  if (mode === "adventure" || mode === "party") {
    return getAvailableVisualKinds(mode);
  }

  return usesCurrency ? getAvailableVisualKinds("strategy") : getAvailableVisualKinds(mode);
}

export function buildGameVisualPrompt(input: {
  kind: GameVisualKind;
  projectTitle: string;
  projectIdea: string | null;
  style: string | null;
  design: GameDesign;
  mode?: GameMode | undefined;
}): string {
  const subject: Record<GameVisualKind, string> = {
    board:
      "a top-down illustrated game board: a square original property-trading tabletop game, with a clear ring of locations and a calm central illustration",
    box: "an original premium board game box cover mockup",
    cards: "a coordinated set of original illustrated game cards arranged as a product spread",
    cover: "an original cinematic cover illustration for the board game",
    currency:
      "a set of original game banknotes, coins, and resource markers laid out for print, with clear empty areas reserved for programmatic values",
    tokens: "a coordinated set of original player tokens, dice, trackers, and component markers"
  };

  return [
    `Create ${subject[input.kind]} for an original board game project.`,
    `Project title: ${input.projectTitle}. Mode: ${input.mode ?? getGameMode(input.design)}. Concept: ${input.design.concept}.`,
    `User idea: ${input.projectIdea ?? "not provided"}. Visual style: ${input.style ?? "classic"}.`,
    input.design.visualDirection
      ? `Shared art direction: ${input.design.visualDirection.artDirection}. Palette: ${input.design.visualDirection.palette}. Motif: ${input.design.visualDirection.motif}.`
      : "Shared art direction: keep a coherent original tabletop-game look across the full set.",
    "Use one coherent art direction across every asset: consistent palette, materials, iconography, and mood.",
    "Make it print-ready, detailed, polished, and family-friendly unless the idea clearly requests a permitted different tone.",
    "Leave readable text, prices, game values, and card rules out of the image: MYBOARD adds them precisely in the final print layout.",
    "Do not include readable text, logos, trademarks, celebrity likenesses, copyrighted characters, or a copied board-game layout.",
    "Do not recreate Monopoly or any other protected game's trade dress, board arrangement, names, or components."
  ].join("\n");
}
