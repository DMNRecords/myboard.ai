export type GameCard = {
  id: string;
  title: string;
  text: string;
  category: "event" | "knowledge" | "challenge";
};

export type GameAsset = {
  id: string;
  title: string;
  url: string;
  description: string;
};

export type GameDesign = {
  schemaVersion: 1;
  concept: string;
  objective: string;
  playerCount: string;
  duration: string;
  rules: string;
  board: {
    title: string;
    spaces: number;
  };
  cards: GameCard[];
  assets: GameAsset[];
};

export const temirtauGameTemplate: GameDesign = {
  schemaVersion: 1,
  concept:
    "Оригинальная семейная игра-путешествие по Темиртау: участники собирают истории города, поддерживают команду и открывают новые места.",
  objective: "Собрать три жетона истории и первым добраться до финальной клетки «Город будущего».",
  playerCount: "2–5 игроков",
  duration: "35–50 минут",
  rules:
    "В свой ход бросьте кубик и передвиньте фишку. Выполните действие клетки, возьмите карточку при совпадении цвета и выбирайте решения вместе, когда игра предлагает командное испытание.",
  board: {
    title: "Маршрут Темиртау",
    spaces: 24
  },
  cards: [
    {
      id: "history-1",
      title: "Голос города",
      text: "Расскажите соседу по игре один факт или семейную историю о городе. Получите жетон истории.",
      category: "knowledge"
    },
    {
      id: "event-1",
      title: "Ветер степи",
      text: "Вся команда выбирает безопасный маршрут. Передвиньтесь на 2 клетки вперёд.",
      category: "event"
    },
    {
      id: "challenge-1",
      title: "Командная смена",
      text: "Назовите три качества хорошего соседа. Если справились — повторите бросок.",
      category: "challenge"
    }
  ],
  assets: []
};

function normalizeText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} must not be empty.`);
  }

  if (normalized.length > maxLength) {
    throw new Error(`${field} must not exceed ${maxLength} characters.`);
  }

  return normalized;
}

export function parseCards(value: string): GameCard[] {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Cards must include at least one card.");
  }

  if (lines.length > 60) {
    throw new Error("Cards must not exceed 60 entries.");
  }

  return lines.map((line, index) => {
    const [rawTitle, ...rawText] = line.split("|");
    const title = normalizeText(rawTitle ?? "", "Card title", 80);
    const text = normalizeText(rawText.join("|") || rawTitle || "", "Card text", 400);

    return {
      id: `card-${index + 1}`,
      title,
      text,
      category: index % 3 === 0 ? "event" : index % 3 === 1 ? "knowledge" : "challenge"
    };
  });
}

export function parseAssets(value: string): GameAsset[] {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 24) {
    throw new Error("Assets must not exceed 24 entries.");
  }

  return lines.map((line, index) => {
    const [rawTitle, rawUrl, ...rawDescription] = line.split("|").map((part) => part.trim());
    const title = normalizeText(rawTitle ?? "", "Asset title", 80);
    const url = normalizeText(rawUrl ?? "", "Asset URL", 2000);
    const description = normalizeText(
      rawDescription.join("|") || rawTitle || "",
      "Asset description",
      240
    );
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("Asset URL must use HTTP or HTTPS.");
    }

    return { id: `asset-${index + 1}`, title, url: parsedUrl.toString(), description };
  });
}

export function createGameDesign(input: {
  concept: string;
  objective: string;
  playerCount: string;
  duration: string;
  rules: string;
  boardTitle: string;
  boardSpaces: string;
  cards: string;
  assets: string;
}): GameDesign {
  const spaces = Number(input.boardSpaces);

  if (!Number.isInteger(spaces) || spaces < 8 || spaces > 60) {
    throw new Error("Board must have between 8 and 60 spaces.");
  }

  return {
    schemaVersion: 1,
    concept: normalizeText(input.concept, "Concept", 1000),
    objective: normalizeText(input.objective, "Objective", 500),
    playerCount: normalizeText(input.playerCount, "Player count", 80),
    duration: normalizeText(input.duration, "Duration", 80),
    rules: normalizeText(input.rules, "Rules", 5000),
    board: {
      title: normalizeText(input.boardTitle, "Board title", 120),
      spaces
    },
    cards: parseCards(input.cards),
    assets: parseAssets(input.assets)
  };
}

export function formatCards(cards: GameCard[]): string {
  return cards.map((card) => `${card.title} | ${card.text}`).join("\n");
}

export function formatAssets(assets: GameAsset[] = []): string {
  return assets.map((asset) => `${asset.title} | ${asset.url} | ${asset.description}`).join("\n");
}
