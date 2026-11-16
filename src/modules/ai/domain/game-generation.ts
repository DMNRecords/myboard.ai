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
  type GameScenario,
  type GameVisualDirection
} from "../../game-design/domain/game-design";
import { createPropertyEconomyBlueprint } from "../../game-design/domain/property-economy-blueprint";

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
  currency?: { currencyName?: unknown; symbol?: unknown };
  economy?: { currencyName?: unknown; symbol?: unknown; startAmount?: unknown };
  roles?: Array<{ name?: unknown; goal?: unknown; ability?: unknown }>;
  scenario?: { title?: unknown; hook?: unknown; stages?: unknown };
  resources?: Array<{ name?: unknown; icon?: unknown; startAmount?: unknown }>;
  propertyNames?: unknown;
  eventsDeckTitle?: unknown;
  opportunitiesDeckTitle?: unknown;
  minorUpgradeName?: unknown;
  majorUpgradeName?: unknown;
  eventCards?: GeneratedCard[];
  opportunityCards?: GeneratedCard[];
  visualDirection?: { artDirection?: unknown; palette?: unknown; motif?: unknown };
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

function parseVisualDirection(
  value: GeneratedGame["visualDirection"]
): GameVisualDirection | undefined {
  if (
    !value ||
    typeof value.artDirection !== "string" ||
    typeof value.palette !== "string" ||
    typeof value.motif !== "string"
  ) {
    return undefined;
  }

  const artDirection = value.artDirection.trim().slice(0, 240);
  const palette = value.palette.trim().slice(0, 160);
  const motif = value.motif.trim().slice(0, 160);

  return artDirection && palette && motif ? { artDirection, palette, motif } : undefined;
}

function textArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function themedEconomyCards(input: {
  generated?: GeneratedCard[] | undefined;
  fallback: GameCard[];
  category: GameCard["category"];
}): GameCard[] {
  return input.fallback.map((fallback, index) => {
    const generated = input.generated?.[index];

    return {
      id: fallback.id,
      category: input.category,
      title:
        typeof generated?.title === "string" && generated.title.trim()
          ? generated.title.trim().slice(0, 80)
          : fallback.title,
      text:
        typeof generated?.text === "string" && generated.text.trim()
          ? generated.text.trim().slice(0, 400)
          : fallback.text
    };
  });
}

function createPropertyEconomyGame(input: {
  concept: string;
  objective: string;
  playerCount: string;
  duration: string;
  rules: string;
  boardTitle?: string | undefined;
  propertyNames?: unknown;
  currencyName?: unknown;
  currencySymbol?: unknown;
  eventsDeckTitle?: unknown;
  opportunitiesDeckTitle?: unknown;
  minorUpgradeName?: unknown;
  majorUpgradeName?: unknown;
  eventCards?: GeneratedCard[] | undefined;
  opportunityCards?: GeneratedCard[] | undefined;
  cards?: GeneratedCard[] | undefined;
  visualDirection?: GameVisualDirection | undefined;
}): GameDesign {
  const propertyNames = textArray(input.propertyNames, 22);
  const boardTitle = input.boardTitle?.trim();
  const currencyName = typeof input.currencyName === "string" ? input.currencyName.trim() : "";
  const currencySymbol =
    typeof input.currencySymbol === "string" ? input.currencySymbol.trim() : "";
  const eventsDeckTitle =
    typeof input.eventsDeckTitle === "string" ? input.eventsDeckTitle.trim() : "";
  const opportunitiesDeckTitle =
    typeof input.opportunitiesDeckTitle === "string" ? input.opportunitiesDeckTitle.trim() : "";
  const minorUpgradeName =
    typeof input.minorUpgradeName === "string" ? input.minorUpgradeName.trim() : "";
  const majorUpgradeName =
    typeof input.majorUpgradeName === "string" ? input.majorUpgradeName.trim() : "";
  const blueprint = createPropertyEconomyBlueprint({
    boardTitle: boardTitle || undefined,
    propertyNames: propertyNames.length === 22 ? propertyNames : undefined,
    currencyName: currencyName || undefined,
    currencySymbol: currencySymbol || undefined,
    eventsDeckTitle: eventsDeckTitle || undefined,
    opportunitiesDeckTitle: opportunitiesDeckTitle || undefined,
    minorUpgradeName: minorUpgradeName || undefined,
    majorUpgradeName: majorUpgradeName || undefined
  });
  const eventsDeck = blueprint.decks[0];
  const opportunitiesDeck = blueprint.decks[1];

  if (!eventsDeck || !opportunitiesDeck) {
    throw new Error("Property economy blueprint must include both card decks.");
  }

  const eventCards = themedEconomyCards({
    generated: input.eventCards ?? input.cards?.slice(0, 16),
    fallback: eventsDeck.cards.map((card) => ({ ...card, category: "event" as const })),
    category: "event"
  });
  const opportunityCards = themedEconomyCards({
    generated: input.opportunityCards ?? input.cards?.slice(16, 32),
    fallback: opportunitiesDeck.cards.map((card) => ({ ...card, category: "challenge" as const })),
    category: "challenge"
  });

  return {
    schemaVersion: 3,
    mode: "property-economy",
    concept: input.concept.trim(),
    objective: input.objective.trim(),
    playerCount: input.playerCount.trim(),
    duration: input.duration.trim(),
    rules: input.rules.trim(),
    board: blueprint.board,
    cards: [...eventCards, ...opportunityCards],
    decks: [
      {
        id: eventsDeck.id,
        title: eventsDeck.title,
        purpose: eventsDeck.purpose,
        cards: eventCards
      },
      {
        id: opportunitiesDeck.id,
        title: opportunitiesDeck.title,
        purpose: opportunitiesDeck.purpose,
        cards: opportunityCards
      }
    ],
    economy: {
      currencyName: blueprint.currency.name,
      symbol: blueprint.currency.symbol,
      startAmount: blueprint.currency.startAmount,
      banknotes: blueprint.currency.banknotes,
      minorUpgradeName: blueprint.components.minorUpgradeName,
      minorUpgrades: blueprint.components.minorUpgrades,
      majorUpgradeName: blueprint.components.majorUpgradeName,
      majorUpgrades: blueprint.components.majorUpgrades,
      playerTokens: blueprint.components.playerTokens,
      dice: blueprint.components.dice
    },
    visualDirection: input.visualDirection,
    assets: []
  };
}

function createPropertyEconomyStarterGame(input: {
  projectTitle: string;
  idea: string;
  language: string;
  style?: string | null | undefined;
  playerCount?: string | undefined;
}): GameDesign {
  const isRussian = input.language !== "en";
  const title = isRussian
    ? `Карта возможностей: ${input.projectTitle}`
    : `Opportunity Map: ${input.projectTitle}`;
  const visualDirection: GameVisualDirection = {
    artDirection: isRussian
      ? `Оригинальная иллюстративная настольная игра по теме «${input.projectTitle}»`
      : `Original illustrated tabletop game themed around “${input.projectTitle}”`,
    palette:
      input.style === "noir"
        ? "графит, сливовый, приглушённое золото"
        : input.style === "retro"
          ? "бирюза, коралл, солнечно-жёлтый"
          : input.style === "future"
            ? "индиго, лазурный, неоновый лиловый"
            : "тёплый кремовый, глубокий фиолетовый, золото",
    motif: isRussian
      ? "карта возможностей, знаки районов, мягкая фактура бумаги"
      : "opportunity map, district symbols, soft paper texture"
  };

  return createPropertyEconomyGame({
    concept: isRussian
      ? `Оригинальная тематическая экономическая игра по вашей идее «${input.projectTitle}». Игроки развивают знаковые локации, собирают наборы и создают собственную историю мира игры.`
      : `An original themed property-trading game based on “${input.projectTitle}”. Players develop locations, build sets, and create their own story in the game's world.`,
    objective: isRussian
      ? "Развить самые ценные локации, грамотно распоряжаться валютой и завершить игру с наибольшим капиталом."
      : "Develop the most valuable locations, manage your currency wisely, and finish with the strongest portfolio.",
    playerCount: input.playerCount
      ? `${input.playerCount} ${isRussian ? "игрока" : "players"}`
      : isRussian
        ? "2–4 игрока"
        : "2–4 players",
    duration: isRussian ? "60–90 минут" : "60–90 minutes",
    rules: isRussian
      ? "В свой ход бросьте два кубика и передвиньтесь. На свободной локации решите, покупать ли её; на чужой — заплатите аренду. Собирайте цветовые наборы, чтобы строить мастерские, а затем флагманские объекты. Карты событий и возможностей меняют ход игры. Если валюты не хватает, можно договариваться об обмене или продать улучшение обратно банку."
      : "On your turn, roll two dice and move. Decide whether to buy an unowned location; pay rent on another player's location. Complete colour sets to build workshops and then flagship locations. Event and opportunity cards change the game. If currency runs short, negotiate a trade or sell an upgrade back to the bank.",
    boardTitle: title,
    propertyNames: Array.from({ length: 22 }, (_, index) =>
      isRussian
        ? `${input.projectTitle} · локация ${index + 1}`
        : `${input.projectTitle} · location ${index + 1}`
    ),
    eventsDeckTitle: isRussian ? `События «${input.projectTitle}»` : `${input.projectTitle} events`,
    opportunitiesDeckTitle: isRussian
      ? `Возможности «${input.projectTitle}»`
      : `${input.projectTitle} opportunities`,
    visualDirection
  });
}

export function createFirstGameInstructions(input: {
  projectTitle: string;
  idea: string;
  style: string | null;
  language: string;
  brief?: string | undefined;
  mode?: GameMode | undefined;
}): string {
  const selectedMode =
    input.mode === "board" || input.mode === "property-economy" || !input.mode
      ? "property-economy"
      : input.mode;

  return [
    "You are MYBOARD.AI, generating the first structured version of an original tabletop game.",
    `Project title: ${input.projectTitle}.`,
    `User idea: ${input.idea}.`,
    `Visual tone: ${input.style ?? "classic"}. Language: ${input.language}.`,
    `Selected setup: ${input.brief ?? "No additional game setup was selected."}`,
    "Invent an original game. Do not copy Monopoly or any protected names, exact rule text, board layout, card text, brands, characters, artwork, or trade dress. You may use broad property-trading mechanics such as purchasing locations, rent, sets, and upgrades in an original rule system.",
    "If the user mentions a protected game, brand, or character, do not refuse and do not mention it in the result. Transform it into an original game using only broad, non-protected themes (for example, a child-friendly city adventure with original characters). You must still return the required JSON.",
    "For city games, use only facts supplied by the user. Do not present unverified street names, dates, or local facts as true. Use fictional themed districts or neutral placeholders when needed.",
    "Return ONLY one valid JSON object, no Markdown, no explanation, with this exact shape:",
    '{"mode":"property-economy|board|cards|adventure|party|strategy","concept":"...","objective":"...","playerCount":"...","duration":"...","rules":"...","visualDirection":{"artDirection":"...","palette":"...","motif":"..."},"board":{"title":"...","spaces":36,"layout":"ring"},"propertyNames":["... exactly 22 original themed names ..."],"currency":{"currencyName":"...","symbol":"..."},"eventsDeckTitle":"...","opportunitiesDeckTitle":"...","minorUpgradeName":"...","majorUpgradeName":"...","eventCards":[{"title":"...","text":"..."}],"opportunityCards":[{"title":"...","text":"..."}],"cards":[{"title":"...","text":"..."}],"decks":[{"title":"...","purpose":"...","cards":[{"title":"...","text":"..."}]}],"economy":{"currencyName":"...","symbol":"...","startAmount":0},"roles":[{"name":"...","goal":"...","ability":"..."}],"scenario":{"title":"...","hook":"...","stages":["..."]},"resources":[{"name":"...","icon":"...","startAmount":0}]}',
    `Selected mode is ${selectedMode}. For property-economy mode return exactly 22 propertyNames, exactly 16 eventCards and exactly 16 opportunityCards. The application owns the balance, prices, rent, quantity of components, and board geometry; write only theme-facing names, card text, currency and rule wording. Never use factual street names unless the user supplied them. For board and strategy modes include board with 12 to 32 named cells; use original themed locations. For cards, adventure, and party modes OMIT board entirely. Cards mode needs decks. Adventure needs scenario and 2 to 4 roles. Strategy needs economy and 2 to 4 resources. Party needs a prompt deck. Return only components useful for the selected mode.`,
    "Use Russian unless the selected language asks otherwise. For property-economy, make all card text concise, original, and family-appropriate when selected."
  ].join("\n");
}

export function createEditableStarterGame(input: {
  projectTitle: string;
  idea: string;
  language: string;
  mode?: GameMode | undefined;
  style?: string | null | undefined;
  playerCount?: string | undefined;
}): GameDesign {
  if (input.mode === "property-economy" || input.mode === "board" || !input.mode) {
    return createPropertyEconomyStarterGame(input);
  }

  const isRussian = input.language !== "en";
  const mode = input.mode ?? "board";
  const title = isRussian ? "Маршрут приключений" : "Adventure Route";
  const isBoardMode = mode === "strategy";

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

export function parseGeneratedGameDesign(
  output: string,
  options: { forcePropertyEconomy?: boolean } = {}
): GameDesign {
  const parsed = JSON.parse(extractJsonObject(output)) as GeneratedGame;
  const generatedMode = isGameMode(parsed.mode) ? parsed.mode : "board";

  if (options.forcePropertyEconomy || generatedMode === "property-economy") {
    const currency = parsed.currency ?? parsed.economy;

    return createPropertyEconomyGame({
      concept: stringField(parsed.concept, "concept"),
      objective: stringField(parsed.objective, "objective"),
      playerCount: stringField(parsed.playerCount, "player count"),
      duration: stringField(parsed.duration, "duration"),
      rules: stringField(parsed.rules, "rules"),
      boardTitle: typeof parsed.board?.title === "string" ? parsed.board.title : undefined,
      propertyNames: parsed.propertyNames,
      currencyName: currency?.currencyName,
      currencySymbol: currency?.symbol,
      eventsDeckTitle: parsed.eventsDeckTitle,
      opportunitiesDeckTitle: parsed.opportunitiesDeckTitle,
      minorUpgradeName: parsed.minorUpgradeName,
      majorUpgradeName: parsed.majorUpgradeName,
      eventCards: parsed.eventCards,
      opportunityCards: parsed.opportunityCards,
      cards: parsed.cards,
      visualDirection: parseVisualDirection(parsed.visualDirection)
    });
  }

  const mode = generatedMode;
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
    resources: parseResources(parsed.resources),
    visualDirection: parseVisualDirection(parsed.visualDirection)
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
