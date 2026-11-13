export const gameTypes = ["board", "adventure", "cards", "party", "strategy"] as const;
export const playerOptions = ["1–2", "2–4", "3–6", "6+"] as const;
export const audienceOptions = ["family", "friends", "adults", "humor"] as const;

export type GameType = (typeof gameTypes)[number];
export type PlayerOption = (typeof playerOptions)[number];
export type AudienceOption = (typeof audienceOptions)[number];

export type GameBrief = {
  gameType: GameType;
  players: PlayerOption;
  audience: AudienceOption;
};

const briefMarker = "[[MYBOARD_BRIEF:";
const briefEndMarker = "]]";

export const gameTypeNames: Record<GameType, string> = {
  board: "Игра с полем",
  adventure: "Приключение и квест",
  cards: "Карточная игра",
  party: "Игра для компании",
  strategy: "Стратегия и ресурсы"
};

export const audienceNames: Record<AudienceOption, string> = {
  family: "Семейная",
  friends: "Для компании",
  adults: "18+",
  humor: "Юмор и лёгкость"
};

export function isGameType(value: string): value is GameType {
  return gameTypes.some((type) => type === value);
}

export function isPlayerOption(value: string): value is PlayerOption {
  return playerOptions.some((players) => players === value);
}

export function isAudienceOption(value: string): value is AudienceOption {
  return audienceOptions.some((audience) => audience === value);
}

export function createProjectDescription(idea: string, brief: GameBrief): string {
  return `${idea.trim()}\n\n${briefMarker}${JSON.stringify(brief)}${briefEndMarker}`;
}

export function getProjectIdea(description: string | null): string {
  if (!description) return "";

  const markerIndex = description.indexOf(briefMarker);
  return (markerIndex < 0 ? description : description.slice(0, markerIndex)).trim();
}

export function getProjectBrief(description: string | null): GameBrief | null {
  if (!description) return null;

  const markerIndex = description.indexOf(briefMarker);
  const endIndex = description.indexOf(briefEndMarker, markerIndex + briefMarker.length);

  if (markerIndex < 0 || endIndex < 0) return null;

  try {
    const parsed = JSON.parse(
      description.slice(markerIndex + briefMarker.length, endIndex)
    ) as Partial<GameBrief>;

    const gameType = parsed.gameType;
    const players = parsed.players;
    const audience = parsed.audience;

    if (
      !gameType ||
      !players ||
      !audience ||
      !isGameType(gameType) ||
      !isPlayerOption(players) ||
      !isAudienceOption(audience)
    ) {
      return null;
    }

    return {
      gameType,
      players,
      audience
    };
  } catch {
    return null;
  }
}

export function describeGameBriefForAi(brief: GameBrief | null): string {
  if (!brief) return "No additional game setup was selected.";

  return [
    `Game format: ${gameTypeNames[brief.gameType]}.`,
    `Players: ${brief.players}.`,
    `Audience: ${audienceNames[brief.audience]}.`
  ].join(" ");
}
