import { createGameDesign, type GameDesign } from "../../game-design/domain/game-design";

type GeneratedCard = { title?: unknown; text?: unknown };
type GeneratedBoard = { title?: unknown; spaces?: unknown };
type GeneratedGame = {
  concept?: unknown;
  objective?: unknown;
  playerCount?: unknown;
  duration?: unknown;
  rules?: unknown;
  board?: GeneratedBoard;
  cards?: GeneratedCard[];
};

function stringField(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Generated ${field} must be text.`);
  }

  return value;
}

function extractJsonObject(output: string): string {
  const withoutFence = output.replace(/```(?:json)?/gi, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start < 0 || end <= start) {
    throw new Error("Generated response does not include a JSON object.");
  }

  return withoutFence.slice(start, end + 1);
}

export function createFirstGameInstructions(input: {
  projectTitle: string;
  idea: string;
  style: string | null;
  language: string;
}): string {
  return [
    "You are MYBOARD.AI, generating the first structured version of an original board game.",
    `Project title: ${input.projectTitle}.`,
    `User idea: ${input.idea}.`,
    `Visual tone: ${input.style ?? "classic"}. Language: ${input.language}.`,
    "Invent an original game. Do not copy Monopoly or any protected game mechanics, names, board layout, card text, brands, characters, artwork, or trade dress.",
    "For city games, use only facts supplied by the user. Do not present unverified street names, dates, or local facts as true. Use fictional themed districts or neutral placeholders when needed.",
    "Return ONLY one valid JSON object, no Markdown, no explanation, with this exact shape:",
    '{"concept":"...","objective":"...","playerCount":"...","duration":"...","rules":"...","board":{"title":"...","spaces":24},"cards":[{"title":"...","text":"..."}]}',
    "Use Russian unless the selected language asks otherwise. Make the rules concise. Include 4 to 6 short thematic cards. Board spaces must be an integer from 8 to 60."
  ].join("\n");
}

export function parseGeneratedGameDesign(output: string): GameDesign {
  const parsed = JSON.parse(extractJsonObject(output)) as GeneratedGame;

  if (!parsed.board || !Array.isArray(parsed.cards)) {
    throw new Error("Generated game is missing a board or cards.");
  }

  const cards = parsed.cards
    .map(
      (card) => `${stringField(card.title, "card title")} | ${stringField(card.text, "card text")}`
    )
    .join("\n");

  return createGameDesign({
    concept: stringField(parsed.concept, "concept"),
    objective: stringField(parsed.objective, "objective"),
    playerCount: stringField(parsed.playerCount, "player count"),
    duration: stringField(parsed.duration, "duration"),
    rules: stringField(parsed.rules, "rules"),
    boardTitle: stringField(parsed.board.title, "board title"),
    boardSpaces: String(parsed.board.spaces),
    cards,
    assets: ""
  });
}
