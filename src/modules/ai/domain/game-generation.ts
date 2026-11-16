import {
  createGameDesign,
  isGameMode,
  type GameCard,
  type GameDeck,
  type GameDesign,
  type GameEconomy,
  type GameMode,
  type GameResource,
  type GameRole,
  type GameScenario
} from "../../game-design/domain/game-design";

type GeneratedCard = { title?: unknown; text?: unknown };
type GeneratedBoard = {
  title?: unknown;
  spaces?: unknown;
  layout?: unknown;
  cells?: Array<{ kind?: unknown; name?: unknown; price?: unknown; rent?: unknown }>;
};
type GeneratedGame = {
  mode?: unknown;
  concept?: unknown;
  objective?: unknown;
  playerCount?: unknown;
  duration?: unknown;
  rules?: unknown;
  board?: GeneratedBoard;
  cards?: GeneratedCard[];
  decks?: Array<{ title?: unknown; purpose?: unknown; cards?: GeneratedCard[] }>;
  economy?: { currencyName?: unknown; symbol?: unknown; startAmount?: unknown };
  roles?: Array<{ name?: unknown; goal?: unknown; ability?: unknown }>;
  scenario?: { title?: unknown; hook?: unknown; stages?: unknown };
  resources?: Array<{ name?: unknown; icon?: unknown; startAmount?: unknown }>;
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

function integerField(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function cardsFromGenerated(cards: GeneratedCard[] | undefined): string {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("Generated game is missing cards.");
  }

  return cards
    .map(
      (card) => `${stringField(card.title, "card title")} | ${stringField(card.text, "card text")}`
    )
    .join("\n");
}

function normalizeCards(cards: GeneratedCard[] | undefined, prefix: string): GameCard[] {
  if (!Array.isArray(cards)) return [];

  return cards.flatMap((card, index) => {
    if (typeof card.title !== "string" || typeof card.text !== "string") return [];
    return [
      {
        id: `${prefix}-${index + 1}`,
        title: card.title.trim(),
        text: card.text.trim(),
        category: index % 3 === 0 ? "event" : index % 3 === 1 ? "knowledge" : "challenge"
      } as GameCard
    ];
  });
}

function parseDecks(value: GeneratedGame["decks"]): GameDeck[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const decks = value.flatMap((deck, index) => {
    if (typeof deck.title !== "string" || typeof deck.purpose !== "string") return [];
    const cards = normalizeCards(deck.cards, `deck-${index + 1}`);
    return cards.length
      ? [{ id: `deck-${index + 1}`, title: deck.title.trim(), purpose: deck.purpose.trim(), cards }]
      : [];
  });

  return decks.length ? decks : undefined;
}

function parseEconomy(value: GeneratedGame["economy"]): GameEconomy | undefined {
  if (!value || typeof value.currencyName !== "string" || typeof value.symbol !== "string") {
    return undefined;
  }

  return {
    currencyName: value.currencyName.trim(),
    symbol: value.symbol.trim(),
    startAmount: integerField(value.startAmount, 0)
  };
}

function parseRoles(value: GeneratedGame["roles"]): GameRole[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const roles = value.flatMap((role) => {
    if (
      typeof role.name !== "string" ||
      typeof role.goal !== "string" ||
      typeof role.ability !== "string"
    ) {
      return [];
    }
    return [{ name: role.name.trim(), goal: role.goal.trim(), ability: role.ability.trim() }];
  });
  return roles.length ? roles : undefined;
}

function parseScenario(value: GeneratedGame["scenario"]): GameScenario | undefined {
  if (
    !value ||
    typeof value.title !== "string" ||
    typeof value.hook !== "string" ||
    !Array.isArray(value.stages)
  ) {
    return undefined;
  }
  const stages = value.stages.filter((stage): stage is string => typeof stage === "string");
  return stages.length
    ? {
        title: value.title.trim(),
        hook: value.hook.trim(),
        stages: stages.map((stage) => stage.trim())
      }
    : undefined;
}

function parseResources(value: GeneratedGame["resources"]): GameResource[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const resources = value.flatMap((resource) => {
    if (typeof resource.name !== "string" || typeof resource.icon !== "string") return [];
    return [
      {
        name: resource.name.trim(),
        icon: resource.icon.trim(),
        startAmount: integerField(resource.startAmount, 0)
      }
    ];
  });
  return resources.length ? resources : undefined;
}

export function createFirstGameInstructions(input: {
  projectTitle: string;
  idea: string;
  style: string | null;
  language: string;
  brief?: string | undefined;
  mode?: GameMode | undefined;
}): string {
  return [
    "You are MYBOARD.AI, generating the first structured version of an original tabletop game.",
    `Project title: ${input.projectTitle}.`,
    `User idea: ${input.idea}.`,
    `Visual tone: ${input.style ?? "classic"}. Language: ${input.language}.`,
    `Selected setup: ${input.brief ?? "No additional game setup was selected."}`,
    "Invent an original game. Do not copy Monopoly or any protected game mechanics, names, board layout, card text, brands, characters, artwork, or trade dress.",
    "If the user mentions a protected game, brand, or character, do not refuse and do not mention it in the result. Transform it into an original game using only broad, non-protected themes (for example, a child-friendly city adventure with original characters). You must still return the required JSON.",
    "For city games, use only facts supplied by the user. Do not present unverified street names, dates, or local facts as true. Use fictional themed districts or neutral placeholders when needed.",
    "Return ONLY one valid JSON object, no Markdown, no explanation, with this exact shape:",
    '{"mode":"board|cards|adventure|party|strategy","concept":"...","objective":"...","playerCount":"...","duration":"...","rules":"...","board":{"title":"...","spaces":24,"layout":"ring","cells":[{"name":"...","kind":"start|property|event|tax|rest|goal","price":0,"rent":0}]},"cards":[{"title":"...","text":"..."}],"decks":[{"title":"...","purpose":"...","cards":[{"title":"...","text":"..."}]}],"economy":{"currencyName":"...","symbol":"...","startAmount":0},"roles":[{"name":"...","goal":"...","ability":"..."}],"scenario":{"title":"...","hook":"...","stages":["..."]},"resources":[{"name":"...","icon":"...","startAmount":0}]}',
    `Selected mode is ${input.mode ?? "board"}. For board and strategy modes include board with 12 to 32 named cells; use original themed locations, never claim unverified street names as facts. For cards, adventure, and party modes OMIT board entirely. Cards mode needs decks. Adventure needs scenario and 2 to 4 roles. Strategy needs economy and 2 to 4 resources. Party needs a prompt deck. Return only components useful for the selected mode.`,
    "Use Russian unless the selected language asks otherwise. Make the rules concise and include 4 to 6 short cards."
  ].join("\n");
}

export function createEditableStarterGame(input: {
  projectTitle: string;
  idea: string;
  language: string;
  mode?: GameMode | undefined;
  playerCount?: string | undefined;
}): GameDesign {
  const isRussian = input.language !== "en";
  const mode = input.mode ?? "board";
  const title = isRussian ? "Маршрут приключений" : "Adventure Route";
  const isBoardMode = mode === "board" || mode === "strategy";

  return createGameDesign({
    concept: isRussian
      ? `Оригинальная семейная игра по мотивам вашей идеи: «${input.projectTitle}». Игроки путешествуют по ярким локациям, знакомятся с оригинальными героями и собирают жетоны приключений.`
      : `An original family game based on your idea: “${input.projectTitle}”. Players travel through colourful locations, meet original characters, and collect adventure tokens.`,
    objective: isRussian
      ? mode === "cards"
        ? "Первым набрать четыре жетона приключений за счёт удачных комбинаций карт."
        : "Собрать четыре жетона приключений и первым выполнить цель игры."
      : "Collect four adventure tokens and be the first to complete the goal.",
    playerCount: input.playerCount
      ? `${input.playerCount} ${isRussian ? "игрока" : "players"}`
      : isRussian
        ? "2–4 игрока"
        : "2–4 players",
    duration: isRussian ? "25–35 минут" : "25–35 minutes",
    rules: isRussian
      ? mode === "cards"
        ? "В свой ход возьмите карту, разыграйте её эффект и соберите нужную комбинацию жетонов."
        : "В свой ход выберите действие, выполните эффект компонента и продвиньтесь к общей цели."
      : "On your turn, choose an action, resolve the component effect, and progress toward the shared goal.",
    mode,
    boardTitle: isBoardMode ? title : undefined,
    boardSpaces: isBoardMode ? "24" : undefined,
    cards: isRussian
      ? "Добрый проводник | Выберите игрока: вы оба получаете по жетону приключений.\nСекретный маршрут | Передвиньтесь на две клетки вперёд.\nНеожиданная находка | Возьмите жетон приключений.\nКомандное испытание | Вместе придумайте название новой локации и повторите бросок."
      : "Friendly guide | Choose a player: both of you gain an adventure token.\nSecret route | Move forward two spaces.\nUnexpected discovery | Take an adventure token.\nTeam challenge | Name a new location together and roll again.",
    assets: "",
    decks:
      mode === "cards" || mode === "party"
        ? [
            {
              id: "main-deck",
              title: isRussian ? "Колода приключений" : "Adventure deck",
              purpose: isRussian ? "Главные эффекты и задания" : "Main effects and challenges",
              cards: []
            }
          ]
        : undefined,
    scenario:
      mode === "adventure"
        ? {
            title: isRussian ? "Тайна яркого маршрута" : "Mystery of the bright route",
            hook: isRussian
              ? "Команда отправляется на поиски финальной истории."
              : "The party sets out to find the final story.",
            stages: isRussian
              ? ["Завязка", "Испытание", "Финал"]
              : ["Opening", "Challenge", "Finale"]
          }
        : undefined,
    roles:
      mode === "adventure"
        ? [
            {
              name: isRussian ? "Исследователь" : "Explorer",
              goal: isRussian ? "Открыть путь" : "Reveal a path",
              ability: isRussian
                ? "Раз за игру меняет результат события"
                : "Once per game changes an event outcome"
            },
            {
              name: isRussian ? "Хранитель" : "Keeper",
              goal: isRussian ? "Помочь команде" : "Help the party",
              ability: isRussian ? "Даёт союзнику повторный выбор" : "Gives an ally a second choice"
            }
          ]
        : undefined,
    economy:
      mode === "strategy"
        ? { currencyName: isRussian ? "Искры" : "Sparks", symbol: "✦", startAmount: 10 }
        : undefined,
    resources:
      mode === "strategy"
        ? [
            { name: isRussian ? "Идеи" : "Ideas", icon: "✦", startAmount: 2 },
            { name: isRussian ? "Энергия" : "Energy", icon: "◉", startAmount: 2 }
          ]
        : undefined
  });
}

export function parseGeneratedGameDesign(output: string): GameDesign {
  const parsed = JSON.parse(extractJsonObject(output)) as GeneratedGame;

  const mode = isGameMode(parsed.mode) ? parsed.mode : "board";
  const needsBoard = mode === "board" || mode === "strategy";

  if (needsBoard && !parsed.board) {
    throw new Error("Generated board game is missing a board.");
  }

  const design = createGameDesign({
    concept: stringField(parsed.concept, "concept"),
    objective: stringField(parsed.objective, "objective"),
    playerCount: stringField(parsed.playerCount, "player count"),
    duration: stringField(parsed.duration, "duration"),
    rules: stringField(parsed.rules, "rules"),
    mode,
    boardTitle: parsed.board ? stringField(parsed.board.title, "board title") : undefined,
    boardSpaces: parsed.board ? String(parsed.board.spaces) : undefined,
    cards: cardsFromGenerated(parsed.cards),
    assets: "",
    decks: parseDecks(parsed.decks),
    economy: parseEconomy(parsed.economy),
    roles: parseRoles(parsed.roles),
    scenario: parseScenario(parsed.scenario),
    resources: parseResources(parsed.resources)
  });

  if (!parsed.board || !design.board || !Array.isArray(parsed.board.cells)) {
    return design;
  }

  const cells = parsed.board.cells.flatMap((cell, index) => {
    if (typeof cell.name !== "string") return [];
    const kind = ["start", "property", "event", "tax", "rest", "goal"].includes(String(cell.kind))
      ? (cell.kind as "start" | "property" | "event" | "tax" | "rest" | "goal")
      : "event";
    return [
      {
        id: `space-${index + 1}`,
        name: cell.name.trim(),
        kind,
        price: integerField(cell.price, 0) || undefined,
        rent: integerField(cell.rent, 0) || undefined
      }
    ];
  });

  return {
    ...design,
    board: {
      ...design.board,
      layout:
        parsed.board.layout === "grid" || parsed.board.layout === "path"
          ? parsed.board.layout
          : "ring",
      cells
    }
  };
}
