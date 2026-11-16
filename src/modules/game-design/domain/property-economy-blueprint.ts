export const propertyEconomySpaceKinds = [
  "start",
  "property",
  "route",
  "utility",
  "event",
  "fee",
  "rest",
  "inspection"
] as const;

export type PropertyEconomySpaceKind = (typeof propertyEconomySpaceKinds)[number];

export type PropertyEconomySpace = {
  id: string;
  slot: number;
  kind: PropertyEconomySpaceKind;
  name: string;
  groupId?: string | undefined;
  price?: number | undefined;
  rent?: number | undefined;
  upgradeCost?: number | undefined;
};

export type PropertyEconomyCard = {
  id: string;
  title: string;
  text: string;
};

export type PropertyEconomyDeck = {
  id: "events" | "opportunities";
  title: string;
  purpose: string;
  cards: PropertyEconomyCard[];
};

export type PropertyEconomyBanknote = {
  value: number;
  quantity: number;
};

export type PropertyEconomyPrintComponent = {
  id: string;
  name: string;
  quantity: number;
  size: string;
  paper: string;
  note: string;
};

export type PropertyEconomyBlueprint = {
  board: {
    title: string;
    layout: "ring";
    spaces: 36;
    cells: PropertyEconomySpace[];
  };
  decks: PropertyEconomyDeck[];
  currency: {
    name: string;
    symbol: string;
    startAmount: number;
    banknotes: PropertyEconomyBanknote[];
  };
  components: {
    playerTokens: number;
    minorUpgradeName: string;
    minorUpgrades: number;
    majorUpgradeName: string;
    majorUpgrades: number;
    dice: number;
  };
  printComponents: PropertyEconomyPrintComponent[];
};

export type PropertyEconomyTheme = {
  boardTitle?: string | undefined;
  propertyNames?: string[] | undefined;
  currencyName?: string | undefined;
  currencySymbol?: string | undefined;
  eventsDeckTitle?: string | undefined;
  opportunitiesDeckTitle?: string | undefined;
  minorUpgradeName?: string | undefined;
  majorUpgradeName?: string | undefined;
};

const propertySlots = [
  { groupId: "ember", price: 40, rent: 4, upgradeCost: 30 },
  { groupId: "ember", price: 50, rent: 5, upgradeCost: 30 },
  { groupId: "lagoon", price: 70, rent: 7, upgradeCost: 40 },
  { groupId: "lagoon", price: 80, rent: 8, upgradeCost: 40 },
  { groupId: "lagoon", price: 90, rent: 9, upgradeCost: 40 },
  { groupId: "bloom", price: 110, rent: 11, upgradeCost: 50 },
  { groupId: "bloom", price: 120, rent: 12, upgradeCost: 50 },
  { groupId: "bloom", price: 130, rent: 13, upgradeCost: 50 },
  { groupId: "jade", price: 150, rent: 15, upgradeCost: 60 },
  { groupId: "jade", price: 160, rent: 16, upgradeCost: 60 },
  { groupId: "jade", price: 170, rent: 17, upgradeCost: 60 },
  { groupId: "violet", price: 190, rent: 19, upgradeCost: 70 },
  { groupId: "violet", price: 200, rent: 20, upgradeCost: 70 },
  { groupId: "violet", price: 210, rent: 21, upgradeCost: 70 },
  { groupId: "copper", price: 230, rent: 23, upgradeCost: 80 },
  { groupId: "copper", price: 240, rent: 24, upgradeCost: 80 },
  { groupId: "copper", price: 250, rent: 25, upgradeCost: 80 },
  { groupId: "silver", price: 270, rent: 27, upgradeCost: 90 },
  { groupId: "silver", price: 280, rent: 28, upgradeCost: 90 },
  { groupId: "silver", price: 290, rent: 29, upgradeCost: 90 },
  { groupId: "gold", price: 320, rent: 32, upgradeCost: 100 },
  { groupId: "gold", price: 340, rent: 34, upgradeCost: 100 }
] as const;

const defaultPropertyNames = [
  "Тихая площадь",
  "Садовая галерея",
  "Ремесленный ряд",
  "Дом историй",
  "Северная арка",
  "Улица мастеров",
  "Фонтан идей",
  "Зелёный квартал",
  "Каменная пристань",
  "Панорамный мост",
  "Площадь открытий",
  "Театральный переулок",
  "Лабораторный двор",
  "Ночной бульвар",
  "Речной рынок",
  "Башня ветров",
  "Оранжерея",
  "Парк огней",
  "Терраса путешествий",
  "Квартал будущего",
  "Золотая набережная",
  "Главная сцена"
] as const;

const eventCardTexts = [
  "Городской праздник привлёк гостей. Получите 20 единиц валюты.",
  "Ремонт площади задержал маршрут. Пропустите следующий ход.",
  "Ваша идея стала популярной. Передвиньтесь на ближайшую локацию вашей группы.",
  "Совместный проект завершён. Каждый игрок получает по 10 единиц валюты.",
  "Найдена короткая дорога. Сделайте ещё один бросок.",
  "Срочная проверка. Перейдите на клетку инспекции.",
  "Удачная афиша. Возьмите 15 единиц валюты из банка.",
  "Непогода изменила планы. Вернитесь на две клетки.",
  "Вы помогли соседнему району. Получите скидку 10 на следующее улучшение.",
  "Новый маршрут открылся вовремя. Перейдите на ближайший маршрут.",
  "Команда волонтёров пришла на помощь. Освободитесь от инспекции без платы.",
  "Интересная встреча вдохновила вас. Получите карту возможностей.",
  "Потерянный билет найден. Получите 5 единиц валюты.",
  "Транспортная задержка. Передвиньтесь на три клетки назад.",
  "Городская премия. Получите 30 единиц валюты.",
  "Выберите игрока для дружеского обмена одной картой возможностей."
] as const;

const opportunityCardTexts = [
  "Удачная инвестиция. Получите 25 единиц валюты.",
  "Соберите по 5 единиц валюты с каждого игрока за совместный проект.",
  "Выберите свободную локацию: при покупке её цена снижается на 10.",
  "Ваш маршрут стал удобнее. Получите 10 единиц валюты за каждый свой маршрут.",
  "Обновите одну свою локацию со скидкой 20.",
  "Пожертвуйте 10 единиц валюты в фонд города и получите повторный бросок.",
  "Ваша витрина заметна издалека. Следующий игрок платит вам 10 единиц валюты.",
  "Партнёрство с сервисом. Получите 15 единиц валюты за каждую свою службу.",
  "Найдите новую точку роста. Переместитесь на любую свободную локацию.",
  "Смелое решение. Обменяйте одну свою карту на карту из колоды событий.",
  "Чистая энергия. Следующая плата за службу отменяется.",
  "Личный рекорд. Получите 20 единиц валюты.",
  "Рынок выходного дня. Каждый игрок получает по 5 единиц валюты.",
  "Забота о районе. Заплатите 10 единиц валюты или пропустите ход.",
  "Вы получили право первого выбора: после броска можете передвинуться на одну клетку вперёд или назад.",
  "Ваше объявление сработало. Возьмите ещё одну карту возможностей."
] as const;

function asCards(prefix: string, texts: readonly string[]): PropertyEconomyCard[] {
  return texts.map((text, index) => ({
    id: `${prefix}-${index + 1}`,
    title: `${prefix === "event" ? "Событие" : "Возможность"} ${index + 1}`,
    text
  }));
}

function propertyCell(index: number, names: readonly string[]): PropertyEconomySpace {
  const slot = propertySlots[index];

  if (!slot) {
    throw new Error("Property economy blueprint has too many property slots.");
  }

  return {
    id: `property-${index + 1}`,
    slot: 0,
    kind: "property",
    name: names[index] || `Локация ${index + 1}`,
    groupId: slot.groupId,
    price: slot.price,
    rent: slot.rent,
    upgradeCost: slot.upgradeCost
  };
}

function routeCell(index: number): PropertyEconomySpace {
  return {
    id: `route-${index + 1}`,
    slot: 0,
    kind: "route",
    name: `Маршрут ${index + 1}`,
    price: 120,
    rent: 18
  };
}

function utilityCell(index: number): PropertyEconomySpace {
  return {
    id: `utility-${index + 1}`,
    slot: 0,
    kind: "utility",
    name: index === 0 ? "Служба света" : "Служба связи",
    price: 150,
    rent: 12
  };
}

export function createPropertyEconomyBlueprint(
  theme: PropertyEconomyTheme = {}
): PropertyEconomyBlueprint {
  let propertyIndex = 0;
  let routeIndex = 0;
  let utilityIndex = 0;
  const propertyNames = theme.propertyNames?.filter(Boolean) ?? defaultPropertyNames;

  const cellSpecs: Array<PropertyEconomySpace | (() => PropertyEconomySpace)> = [
    { id: "start", slot: 0, kind: "start", name: "Стартовый круг" },
    () => propertyCell(propertyIndex++, propertyNames),
    { id: "event-1", slot: 0, kind: "event", name: "Событие" },
    () => propertyCell(propertyIndex++, propertyNames),
    () => routeCell(routeIndex++),
    () => propertyCell(propertyIndex++, propertyNames),
    { id: "fee-1", slot: 0, kind: "fee", name: "Городской сбор" },
    () => propertyCell(propertyIndex++, propertyNames),
    () => utilityCell(utilityIndex++),
    () => propertyCell(propertyIndex++, propertyNames),
    { id: "inspection", slot: 0, kind: "inspection", name: "Инспекция" },
    () => propertyCell(propertyIndex++, propertyNames),
    { id: "event-2", slot: 0, kind: "event", name: "Возможность" },
    () => propertyCell(propertyIndex++, propertyNames),
    () => routeCell(routeIndex++),
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames),
    { id: "rest", slot: 0, kind: "rest", name: "Площадь отдыха" },
    () => propertyCell(propertyIndex++, propertyNames),
    { id: "event-3", slot: 0, kind: "event", name: "Событие" },
    () => propertyCell(propertyIndex++, propertyNames),
    () => utilityCell(utilityIndex++),
    () => propertyCell(propertyIndex++, propertyNames),
    () => routeCell(routeIndex++),
    () => propertyCell(propertyIndex++, propertyNames),
    { id: "fee-2", slot: 0, kind: "fee", name: "Фонд развития" },
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames),
    () => routeCell(routeIndex++),
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames),
    () => propertyCell(propertyIndex++, propertyNames)
  ];

  const cells = cellSpecs.map((cell, index) => {
    const resolved = typeof cell === "function" ? cell() : cell;
    return { ...resolved, slot: index + 1 };
  });

  const banknotes = [
    { value: 1, quantity: 40 },
    { value: 5, quantity: 30 },
    { value: 10, quantity: 30 },
    { value: 20, quantity: 20 },
    { value: 50, quantity: 20 },
    { value: 100, quantity: 20 },
    { value: 500, quantity: 10 }
  ];

  return {
    board: {
      title: theme.boardTitle?.trim() || "Карта возможностей",
      layout: "ring",
      spaces: 36,
      cells
    },
    decks: [
      {
        id: "events",
        title: theme.eventsDeckTitle?.trim() || "События квартала",
        purpose: "Неожиданные изменения маршрута и общего мира игры",
        cards: asCards("event", eventCardTexts)
      },
      {
        id: "opportunities",
        title: theme.opportunitiesDeckTitle?.trim() || "Возможности",
        purpose: "Инвестиции, обмены и решения игрока",
        cards: asCards("opportunity", opportunityCardTexts)
      }
    ],
    currency: {
      name: theme.currencyName?.trim() || "кредиты",
      symbol: theme.currencySymbol?.trim() || "◈",
      startAmount: 260,
      banknotes
    },
    components: {
      playerTokens: 6,
      minorUpgradeName: theme.minorUpgradeName?.trim() || "мастерские",
      minorUpgrades: 66,
      majorUpgradeName: theme.majorUpgradeName?.trim() || "флагманские объекты",
      majorUpgrades: 22,
      dice: 2
    },
    printComponents: [
      {
        id: "board",
        name: "Игровое поле",
        quantity: 1,
        size: "выбирается профилем: 400 × 400, 500 × 500 или 700 × 700 мм",
        paper: "переплётный картон 1,5–2 мм с кашировкой",
        note: "Вылет 3 мм, безопасная зона 5 мм"
      },
      {
        id: "event-cards",
        name: "Карты событий",
        quantity: 16,
        size: "63 × 88 мм",
        paper: "матовая мелованная 300–350 г/м²",
        note: "Скругление углов по желанию"
      },
      {
        id: "opportunity-cards",
        name: "Карты возможностей",
        quantity: 16,
        size: "63 × 88 мм",
        paper: "матовая мелованная 300–350 г/м²",
        note: "Скругление углов по желанию"
      },
      {
        id: "ownership-cards",
        name: "Карты владения",
        quantity: 22,
        size: "63 × 88 мм",
        paper: "матовая мелованная 300–350 г/м²",
        note: "Одна карта на каждую локацию"
      },
      {
        id: "banknotes",
        name: "Банкноты",
        quantity: banknotes.reduce((total, banknote) => total + banknote.quantity, 0),
        size: "120 × 55 мм",
        paper: "офсетная 90–120 г/м²",
        note: "Номиналы и тираж указаны в ведомости"
      },
      {
        id: "upgrades",
        name: "Жетоны улучшений",
        quantity: 88,
        size: "25 × 25 мм",
        paper: "плотный картон 1–1,5 мм",
        note: "66 обычных и 22 флагманских"
      },
      {
        id: "tokens",
        name: "Фишки игроков",
        quantity: 6,
        size: "25–30 мм",
        paper: "плотный картон 1–1,5 мм или готовые пластиковые фишки",
        note: "Два кубика приобретаются отдельно"
      },
      {
        id: "rules",
        name: "Правила",
        quantity: 1,
        size: "A4",
        paper: "115–150 г/м²",
        note: "Двусторонняя печать"
      },
      {
        id: "box",
        name: "Коробка",
        quantity: 1,
        size: "по развёртке типографии",
        paper: "переплётный картон 1,5–2 мм + мелованная бумага 130–170 г/м²",
        note: "Изготавливается по макету и размерам типографии"
      }
    ]
  };
}
