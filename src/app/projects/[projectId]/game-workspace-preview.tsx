import {
  getGameDecks,
  getGameMode,
  hasGameBoard,
  type GameDesign
} from "@/modules/game-design/domain/game-design";

const modeLabels = {
  board: "Игра с полем",
  cards: "Карточная игра",
  adventure: "Приключение",
  party: "Игра для компании",
  strategy: "Стратегия"
} as const;

function previewCards(design: GameDesign) {
  return design.cards.slice(0, 3);
}

export function GameWorkspacePreview({ design }: { design: GameDesign }) {
  const mode = getGameMode(design);
  const cards = previewCards(design);
  const board = hasGameBoard(design) ? design.board : null;

  return (
    <section className={`format-preview format-preview-${mode}`} aria-label="Макет игры">
      <div className="format-preview-heading">
        <span>{modeLabels[mode]}</span>
        <strong>
          {mode === "cards" ? `${design.cards.length} карт в колоде` : design.objective}
        </strong>
      </div>

      {board ? (
        <div className="format-board" aria-label={`${board.title}: ${board.spaces} клеток`}>
          <div className="format-board-title">{board.title}</div>
          <div className="format-board-grid">
            {Array.from({ length: board.spaces }, (_, index) => {
              const cell = board.cells?.[index];
              return (
                <span
                  className={`format-space format-space-${cell?.kind ?? "event"}`}
                  key={cell?.id ?? index}
                >
                  <b>{index + 1}</b>
                  <small>{cell?.name ?? "Событие"}</small>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === "cards" ? (
        <div className="deck-preview">
          <div className="deck-preview-stack" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>{getGameDecks(design)[0]?.title ?? "Основная колода"}</strong>
            <p>{getGameDecks(design)[0]?.purpose ?? "Карты действий и комбинаций"}</p>
          </div>
        </div>
      ) : null}

      {mode === "adventure" ? (
        <div className="quest-preview">
          <div>
            <span>СЦЕНАРИЙ</span>
            <strong>{design.scenario?.title ?? "Ваше приключение"}</strong>
            <p>{design.scenario?.hook ?? design.concept}</p>
          </div>
          <ol>
            {(design.scenario?.stages ?? ["Завязка", "Испытание", "Финал"]).map((stage) => (
              <li key={stage}>{stage}</li>
            ))}
          </ol>
          <div className="role-chips">
            {(design.roles ?? []).map((role) => (
              <span key={role.name}>{role.name}</span>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "party" ? (
        <div className="party-preview">
          <div className="party-round">РАУНД 01</div>
          <strong>Вытяните карту, выполните задание и передайте ход.</strong>
          <span>{design.playerCount}</span>
        </div>
      ) : null}

      {mode === "strategy" ? (
        <div className="resource-chips">
          {design.economy ? (
            <span>
              {design.economy.symbol} {design.economy.currencyName}: {design.economy.startAmount}
            </span>
          ) : null}
          {(design.resources ?? []).map((resource) => (
            <span key={resource.name}>
              {resource.icon} {resource.name}: {resource.startAmount}
            </span>
          ))}
        </div>
      ) : null}

      <div className="format-card-row">
        {cards.map((card) => (
          <article className="format-card" key={card.id}>
            <span>{card.category}</span>
            <strong>{card.title}</strong>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
