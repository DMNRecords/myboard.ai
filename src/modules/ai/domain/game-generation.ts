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
  brief?: string;
}): string {
  return [
    "You are MYBOARD.AI, generating the first structured version of an original board game.",
    `Project title: ${input.projectTitle}.`,
    `User idea: ${input.idea}.`,
    `Visual tone: ${input.style ?? "classic"}. Language: ${input.language}.`,
    `Selected setup: ${input.brief ?? "No additional game setup was selected."}`,
    "Invent an original game. Do not copy Monopoly or any protected game mechanics, names, board layout, card text, brands, characters, artwork, or trade dress.",
    "If the user mentions a protected game, brand, or character, do not refuse and do not mention it in the result. Transform it into an original game using only broad, non-protected themes (for example, a child-friendly city adventure with original characters). You must still return the required JSON.",
    "For city games, use only facts supplied by the user. Do not present unverified street names, dates, or local facts as true. Use fictional themed districts or neutral placeholders when needed.",
    "Return ONLY one valid JSON object, no Markdown, no explanation, with this exact shape:",
    '{"concept":"...","objective":"...","playerCount":"...","duration":"...","rules":"...","board":{"title":"...","spaces":24},"cards":[{"title":"...","text":"..."}]}',
    "Use Russian unless the selected language asks otherwise. Make the rules concise. Include 4 to 6 short thematic cards. For a card game, keep the board minimal and focus the rules and components on the cards. Board spaces must be an integer from 8 to 60."
  ].join("\n");
}

export function createEditableStarterGame(input: {
  projectTitle: string;
  idea: string;
  language: string;
}): GameDesign {
  const isRussian = input.language !== "en";
  const title = isRussian ? "Маршрут приключений" : "Adventure Route";

  return createGameDesign({
    concept: isRussian
      ? `Оригинальная семейная игра по мотивам вашей идеи: «${input.projectTitle}». Игроки путешествуют по ярким локациям, знакомятся с оригинальными героями и собирают жетоны приключений.`
      : `An original family game based on your idea: “${input.projectTitle}”. Players travel through colourful locations, meet original characters, and collect adventure tokens.`,
    objective: isRussian
      ? "Собрать четыре жетона приключений и первым добраться до финальной локации."
      : "Collect four adventure tokens and be the first to reach the final location.",
    playerCount: isRussian ? "2–4 игрока" : "2–4 players",
    duration: isRussian ? "25–35 минут" : "25–35 minutes",
    rules: isRussian
      ? "В свой ход бросьте кубик, переместитесь по полю и выполните действие клетки. Карточки событий дают выбор: получить жетон, помочь другому игроку или изменить маршрут."
      : "On your turn, roll a die, move on the board, and resolve the space. Event cards offer a choice: gain a token, help another player, or change the route.",
    boardTitle: title,
    boardSpaces: "24",
    cards: isRussian
      ? "Добрый проводник | Выберите игрока: вы оба получаете по жетону приключений.\nСекретный маршрут | Передвиньтесь на две клетки вперёд.\nНеожиданная находка | Возьмите жетон приключений.\nКомандное испытание | Вместе придумайте название новой локации и повторите бросок."
      : "Friendly guide | Choose a player: both of you gain an adventure token.\nSecret route | Move forward two spaces.\nUnexpected discovery | Take an adventure token.\nTeam challenge | Name a new location together and roll again.",
    assets: ""
  });
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
