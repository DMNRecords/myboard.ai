import type { CSSProperties } from "react";

import {
  getGameDecks,
  type GameBoardSpace,
  type GameCard,
  type GameDesign
} from "@/modules/game-design/domain/game-design";
import {
  getPropertyEconomyPrintManifest,
  type PrintProfile
} from "@/modules/exports/domain/print-profile";

type PrintKitProps = {
  design: GameDesign;
  profile: PrintProfile;
  projectTitle: string;
  version: number;
};

function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );
}

function cellPosition(index: number, total: number) {
  const perSide = Math.ceil(total / 4);
  const side = Math.floor(index / perSide);
  const offset = index % perSide;

  if (side === 0) return { gridColumn: offset + 1, gridRow: 1 };
  if (side === 1) return { gridColumn: 11, gridRow: offset + 2 };
  if (side === 2) return { gridColumn: 10 - offset, gridRow: 11 };
  return { gridColumn: 1, gridRow: 10 - offset };
}

function boardArt(design: GameDesign) {
  return (
    design.assets.find((asset) => asset.kind === "board")?.url ??
    design.assets.find((asset) => /AI:\s*board/i.test(asset.title))?.url
  );
}

function coverArt(design: GameDesign) {
  return (
    design.assets.find((asset) => asset.kind === "cover")?.url ??
    design.assets.find((asset) => /AI:\s*cover/i.test(asset.title))?.url
  );
}

function boxArt(design: GameDesign) {
  return (
    design.assets.find((asset) => asset.kind === "box")?.url ??
    design.assets.find((asset) => /AI:\s*box/i.test(asset.title))?.url
  );
}

function themedArt(design: GameDesign, kind: "cards" | "currency") {
  return (
    design.assets.find((asset) => asset.kind === kind)?.url ??
    design.assets.find((asset) => new RegExp(`AI:\\s*${kind}`, "i").test(asset.title))?.url
  );
}

function printStyle(profile: PrintProfile): CSSProperties {
  return {
    "--kit-page-width": `${profile.pageWidthMm}mm`,
    "--kit-page-height": `${profile.pageHeightMm}mm`,
    "--kit-board-size": `${profile.boardTiles.boardSizeMm}mm`
  } as CSSProperties;
}

function PropertyBoard({ design }: { design: GameDesign }) {
  const cells = design.board?.cells ?? [];
  const art = boardArt(design);

  return (
    <div className="print-property-board" aria-label="Игровое поле">
      <div
        className="print-property-board-core"
        style={art ? { backgroundImage: `url("${art}")` } : undefined}
      >
        <span>
          {design.economy ? `${design.economy.symbol} ${design.economy.currencyName}` : ""}
        </span>
        <strong>{design.board?.title}</strong>
        <small>{design.objective}</small>
      </div>
      {cells.map((cell, index) => (
        <article
          className={`print-property-space print-property-space-${cell.kind}`}
          key={cell.id}
          style={cellPosition(index, cells.length)}
        >
          <span>{index + 1}</span>
          <strong>{cell.name}</strong>
          {cell.price ? <small>◈ {cell.price}</small> : null}
        </article>
      ))}
    </div>
  );
}

function GameCardSheet({
  cards,
  title,
  art
}: {
  cards: GameCard[];
  title: string;
  art?: string | undefined;
}) {
  return (
    <section className="print-kit-sheet print-kit-card-sheet">
      <header className="print-kit-heading">
        <span>КОЛОДА</span>
        <h2>{title}</h2>
      </header>
      <div className="print-kit-card-grid">
        {cards.map((card) => (
          <article
            className="print-kit-card"
            key={card.id}
            style={
              art
                ? {
                    backgroundImage: `linear-gradient(145deg, rgb(255 255 255 / 90%), rgb(241 231 255 / 88%)), url("${art}")`
                  }
                : undefined
            }
          >
            <span>{card.category === "event" ? "СОБЫТИЕ" : "ВОЗМОЖНОСТЬ"}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <small>MYBOARD.AI</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function OwnershipCardSheet({ cells }: { cells: GameBoardSpace[] }) {
  return (
    <section className="print-kit-sheet print-kit-card-sheet">
      <header className="print-kit-heading">
        <span>ВЛАДЕНИЕ</span>
        <h2>Карты локаций</h2>
      </header>
      <div className="print-kit-card-grid">
        {cells.map((cell) => (
          <article className="print-kit-card print-ownership-card" key={cell.id}>
            <span>ЛОКАЦИЯ</span>
            <h3>{cell.name}</h3>
            <dl>
              <div>
                <dt>Стоимость</dt>
                <dd>{cell.price}</dd>
              </div>
              <div>
                <dt>Аренда</dt>
                <dd>{cell.rent}</dd>
              </div>
              <div>
                <dt>Улучшение</dt>
                <dd>{cell.upgradeCost}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function BanknoteSheet({
  notes,
  currencyName,
  symbol,
  art
}: {
  notes: Array<{ value: number; number: number }>;
  currencyName: string;
  symbol: string;
  art?: string | undefined;
}) {
  return (
    <section className="print-kit-sheet print-banknote-sheet">
      <header className="print-kit-heading">
        <span>ВАЛЮТА</span>
        <h2>Банкноты · вырезать по контуру</h2>
      </header>
      <div className="print-banknote-grid">
        {notes.map((note) => (
          <article
            className="print-banknote"
            key={`${note.value}-${note.number}`}
            style={
              art
                ? {
                    backgroundImage: `linear-gradient(135deg, rgb(214 231 198 / 92%), rgb(140 180 141 / 88%)), url("${art}")`
                  }
                : undefined
            }
          >
            <span>{currencyName}</span>
            <strong>
              {symbol} {note.value}
            </strong>
            <small>№ {note.number}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function TokenSheet({
  items,
  label
}: {
  items: Array<{ id: string; text: string }>;
  label: string;
}) {
  return (
    <section className="print-kit-sheet print-token-sheet">
      <header className="print-kit-heading">
        <span>ЖЕТОНЫ</span>
        <h2>{label}</h2>
      </header>
      <div className="print-token-grid">
        {items.map((item) => (
          <span key={item.id}>{item.text}</span>
        ))}
      </div>
    </section>
  );
}

export function EconomicPrintKit({ design, profile, projectTitle, version }: PrintKitProps) {
  const board = design.board;
  const decks = getGameDecks(design);
  const propertyCells = board?.cells?.filter((cell) => cell.kind === "property") ?? [];
  const manifest = getPropertyEconomyPrintManifest(design, profile);
  const cardsPerSheet = profile.cardColumns * 3;
  const allNotes = (design.economy?.banknotes ?? []).flatMap((banknote) =>
    Array.from({ length: banknote.quantity }, (_, index) => ({
      value: banknote.value,
      number: index + 1
    }))
  );
  const notePerSheet =
    profile.id === "a0-showcase"
      ? 72
      : profile.id === "a1-standard"
        ? 48
        : profile.id === "a2-compact"
          ? 24
          : 8;
  const upgrades = Array.from({ length: design.economy?.minorUpgrades ?? 0 }, (_, index) => ({
    id: `minor-${index + 1}`,
    text: design.economy?.minorUpgradeName?.slice(0, 1).toUpperCase() || "У"
  })).concat(
    Array.from({ length: design.economy?.majorUpgrades ?? 0 }, (_, index) => ({
      id: `major-${index + 1}`,
      text: design.economy?.majorUpgradeName?.slice(0, 1).toUpperCase() || "Ф"
    }))
  );
  const playerTokens = Array.from({ length: design.economy?.playerTokens ?? 6 }, (_, index) => ({
    id: `player-${index + 1}`,
    text: `Игрок ${index + 1}`
  }));
  const cover = coverArt(design);
  const box = boxArt(design);
  const cardArt = themedArt(design, "cards");
  const currencyArt = themedArt(design, "currency");

  return (
    <div className="print-kit-document" style={printStyle(profile)}>
      <section
        className="print-kit-sheet print-kit-cover"
        style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
      >
        <span>MYBOARD.AI · ГОТОВЫЙ КОМПЛЕКТ</span>
        <h1>{projectTitle}</h1>
        <p>{design.concept}</p>
        <dl>
          <div>
            <dt>Игроки</dt>
            <dd>{design.playerCount}</dd>
          </div>
          <div>
            <dt>Время</dt>
            <dd>{design.duration}</dd>
          </div>
          <div>
            <dt>Версия</dt>
            <dd>{version}</dd>
          </div>
        </dl>
      </section>

      <section className="print-kit-sheet print-kit-box-sheet">
        <header className="print-kit-heading">
          <span>КОРОБКА</span>
          <h2>Лицевая сторона коробки</h2>
          <p>
            Это готовый визуальный макет лицевой стороны. Для развёртки коробки передайте эту
            страницу и ведомость типографии — она подберёт точную высоту по толщине компонентов.
          </p>
        </header>
        <div
          className="print-kit-box-front"
          style={box ? { backgroundImage: `url("${box}")` } : undefined}
        >
          <span>MYBOARD.AI</span>
          <strong>{projectTitle}</strong>
          <small>
            {design.playerCount} · {design.duration}
          </small>
        </div>
      </section>

      <section className="print-kit-sheet print-kit-specification">
        <header className="print-kit-heading">
          <span>ВЕДОМОСТЬ ДЛЯ ТИПОГРАФИИ</span>
          <h2>Что и в каком количестве печатать</h2>
          <p>
            Профиль: {profile.name}. Все тексты и значения уже наложены в макете; изображения
            используются только как тематический слой.
          </p>
        </header>
        <table>
          <thead>
            <tr>
              <th>Элемент</th>
              <th>Тираж</th>
              <th>Размер</th>
              <th>Материал</th>
              <th>Примечание</th>
            </tr>
          </thead>
          <tbody>
            {manifest.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.size}</td>
                <td>{item.paper}</td>
                <td>{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="print-kit-note">
          Перед запуском коробки запросите у типографии их шаблон развёртки: размеры зависят от
          толщины конкретных компонентов.
        </p>
      </section>

      {board ? (
        <section className="print-kit-sheet print-kit-board-sheet">
          <header className="print-kit-heading">
            <span>ИГРОВОЕ ПОЛЕ</span>
            <h2>{board.title}</h2>
          </header>
          <PropertyBoard design={design} />
          <p className="print-kit-cut-note">
            Чистый размер: {profile.boardTiles.boardSizeMm} × {profile.boardTiles.boardSizeMm} мм.
            Вылет {profile.bleedMm} мм, безопасная зона {profile.safeMarginMm} мм.
          </p>
        </section>
      ) : null}

      <section className="print-kit-sheet print-kit-rules">
        <header className="print-kit-heading">
          <span>ПРАВИЛА</span>
          <h2>Как играть</h2>
        </header>
        <p>{design.rules}</p>
        <dl>
          <div>
            <dt>Стартовый капитал</dt>
            <dd>
              {design.economy?.symbol} {design.economy?.startAmount}
            </dd>
          </div>
          <div>
            <dt>Обычные улучшения</dt>
            <dd>{design.economy?.minorUpgrades}</dd>
          </div>
          <div>
            <dt>Финальные улучшения</dt>
            <dd>{design.economy?.majorUpgrades}</dd>
          </div>
          <div>
            <dt>Кубики</dt>
            <dd>{design.economy?.dice ?? 2} шт. (приобретаются отдельно)</dd>
          </div>
        </dl>
      </section>

      {decks.flatMap((deck) =>
        chunks(deck.cards, cardsPerSheet).map((cards, index) => (
          <GameCardSheet
            art={cardArt}
            cards={cards}
            key={`${deck.id}-${index}`}
            title={deck.title}
          />
        ))
      )}

      {chunks(propertyCells, cardsPerSheet).map((cells, index) => (
        <OwnershipCardSheet cells={cells} key={`ownership-${index}`} />
      ))}

      {chunks(allNotes, notePerSheet).map((notes, index) => (
        <BanknoteSheet
          currencyName={design.economy?.currencyName ?? "валюта"}
          key={`notes-${index}`}
          notes={notes}
          symbol={design.economy?.symbol ?? "◈"}
          art={currencyArt}
        />
      ))}

      {chunks(upgrades, 40).map((items, index) => (
        <TokenSheet items={items} key={`upgrades-${index}`} label="Улучшения локаций" />
      ))}
      <TokenSheet items={playerTokens} label="Фишки игроков" />
    </div>
  );
}
