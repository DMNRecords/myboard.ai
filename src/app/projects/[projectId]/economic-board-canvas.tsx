"use client";

import { useMemo, useState } from "react";

import type {
  GameAsset,
  GameBoardSpace,
  GameCard,
  GameDeck
} from "@/modules/game-design/domain/game-design";

type BoardCanvasProps = {
  title: string;
  concept: string;
  cells: GameBoardSpace[];
  decks: GameDeck[];
  economy?: { currencyName: string; symbol: string } | undefined;
  assets: GameAsset[];
};

const kindLabels: Record<GameBoardSpace["kind"], string> = {
  start: "Старт",
  property: "Локация",
  route: "Маршрут",
  utility: "Служба",
  event: "Карточка",
  fee: "Сбор",
  rest: "Отдых",
  inspection: "Инспекция",
  tax: "Сбор",
  goal: "Цель"
};

function cellPosition(index: number, total: number) {
  const perSide = Math.ceil(total / 4);
  const side = Math.floor(index / perSide);
  const offset = index % perSide;

  if (side === 0) return { column: offset + 1, row: 1 };
  if (side === 1) return { column: 11, row: offset + 2 };
  if (side === 2) return { column: 10 - offset, row: 11 };
  return { column: 1, row: 10 - offset };
}

function getBoardArt(assets: GameAsset[]): string | undefined {
  return (
    assets.find((asset) => asset.kind === "board")?.url ??
    assets.find((asset) => /AI:\s*board/i.test(asset.title))?.url
  );
}

export function EconomicBoardCanvas({
  title,
  concept,
  cells,
  decks,
  economy,
  assets
}: BoardCanvasProps) {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const boardArt = useMemo(() => getBoardArt(assets), [assets]);
  const selectedCell = cells[selectedCellIndex] ?? cells[0];

  return (
    <section className="economic-board-viewer" aria-label="Интерактивное поле игры">
      <div className="economic-board-toolbar">
        <div>
          <span>2D-ПРЕДПРОСМОТР</span>
          <strong>Поле, клетки и карточки</strong>
        </div>
        <div className="economic-board-controls" aria-label="Управление видом поля">
          <button onClick={() => setZoom((value) => Math.max(0.82, value - 0.08))} type="button">
            −
          </button>
          <button onClick={() => setRotation((value) => value - 15)} type="button">
            ↺
          </button>
          <button onClick={() => setRotation((value) => value + 15)} type="button">
            ↻
          </button>
          <button onClick={() => setZoom((value) => Math.min(1.18, value + 0.08))} type="button">
            +
          </button>
          <button
            className="economic-board-reset"
            onClick={() => {
              setRotation(0);
              setZoom(1);
            }}
            type="button"
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="economic-board-stage">
        <div
          className="economic-board-surface"
          style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
        >
          <div
            className="economic-board-core"
            style={boardArt ? { backgroundImage: `url("${boardArt}")` } : undefined}
          >
            <span>{economy ? `${economy.symbol} ${economy.currencyName}` : "ВАША ВАЛЮТА"}</span>
            <strong>{title}</strong>
            <small>{boardArt ? "AI-визуал добавлен" : "AI-визуал появится здесь"}</small>
          </div>
          {cells.map((cell, index) => {
            const position = cellPosition(index, cells.length);

            return (
              <button
                aria-pressed={selectedCellIndex === index}
                className={`economic-board-cell economic-board-cell-${cell.kind}${
                  selectedCellIndex === index ? " economic-board-cell-selected" : ""
                }`}
                key={cell.id}
                onClick={() => {
                  setSelectedCellIndex(index);
                  setSelectedCard(null);
                }}
                style={{ gridColumn: position.column, gridRow: position.row }}
                type="button"
              >
                <b>{index + 1}</b>
                <span>{cell.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="economic-board-inspector" aria-live="polite">
        {selectedCard ? (
          <>
            <span>КАРТОЧКА</span>
            <strong>{selectedCard.title}</strong>
            <p>{selectedCard.text}</p>
          </>
        ) : selectedCell ? (
          <>
            <span>{kindLabels[selectedCell.kind]}</span>
            <strong>{selectedCell.name}</strong>
            <p>
              {selectedCell.price ? `Стоимость: ${selectedCell.price}. ` : ""}
              {selectedCell.rent ? `Базовая аренда: ${selectedCell.rent}. ` : ""}
              {selectedCell.upgradeCost
                ? `Улучшение: ${selectedCell.upgradeCost}.`
                : "Нажмите на карточку ниже, чтобы прочитать её полностью."}
            </p>
          </>
        ) : (
          <p>{concept}</p>
        )}
      </div>

      <div className="economic-card-shelf" aria-label="Карточки игры">
        {decks.map((deck) => (
          <article key={deck.id}>
            <header>
              <span>{deck.cards.length} карт</span>
              <strong>{deck.title}</strong>
            </header>
            <div>
              {deck.cards.map((card) => (
                <button
                  className={selectedCard?.id === card.id ? "economic-card-active" : ""}
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  type="button"
                >
                  <small>{card.category === "event" ? "СОБЫТИЕ" : "ВОЗМОЖНОСТЬ"}</small>
                  <strong>{card.title}</strong>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
