import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getLatestGameVersion } from "@/modules/game-design/application/get-latest-game-version";
import {
  a4HomePrintProfile,
  getPrintProfile,
  getPrintSheetCount,
  printProfiles,
  validatePrintableGame
} from "@/modules/exports/domain/print-profile";
import {
  getGameMode,
  hasGameBoard,
  isPropertyEconomyGame
} from "@/modules/game-design/domain/game-design";
import { getOwnedProjectById } from "@/modules/projects/application/get-owned-projects";

import { PrintButton } from "./print-button";
import { EconomicPrintKit } from "./economic-print-kit";

export const dynamic = "force-dynamic";

function spaces(total: number) {
  return Array.from({ length: total }, (_, index) => index + 1);
}

function cardSheets<T>(cards: T[], cardsPerSheet: number): T[][] {
  return Array.from({ length: Math.ceil(cards.length / cardsPerSheet) }, (_, index) =>
    cards.slice(index * cardsPerSheet, (index + 1) * cardsPerSheet)
  );
}

function boardTiles(profile: typeof a4HomePrintProfile) {
  return Array.from(
    { length: profile.boardTiles.columns * profile.boardTiles.rows },
    (_, index) => ({
      column: index % profile.boardTiles.columns,
      index,
      row: Math.floor(index / profile.boardTiles.columns)
    })
  );
}

function largeBoardSpaces(total: number) {
  const side = Math.ceil(Math.sqrt(total));
  return { side, spaces: Array.from({ length: side * side }, (_, index) => index + 1) };
}

function profileLabel(profile: (typeof printProfiles)[number]): string {
  if (profile.id === "a4-home") return "Стандарт A4";
  if (profile.id === "a4-large-board") return "Поле 50 × 50 см на A4";
  if (profile.id === "a2-compact") return "A2 · 40 × 40 см";
  if (profile.id === "a1-standard") return "A1 · 50 × 50 см";
  return "A0 · 70 × 70 см";
}

export default async function PrintPreviewPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ profile?: string | string[] }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const [project, gameVersion] = await Promise.all([
    getOwnedProjectById(user.id, projectId),
    getLatestGameVersion(user.id, projectId)
  ]);

  if (!project || !gameVersion) {
    notFound();
  }

  const validation = validatePrintableGame(gameVersion.content);
  const query = await searchParams;
  const profile = getPrintProfile(
    query.profile === "large-board"
      ? "a4-large-board"
      : typeof query.profile === "string"
        ? query.profile
        : undefined
  );
  const isLargeBoard = profile.id === "a4-large-board";
  const design = gameVersion.content;
  const board = hasGameBoard(design) ? design.board : null;
  const printableBoard = board ? largeBoardSpaces(board.spaces) : null;
  const gameMode = getGameMode(design);

  return (
    <main className={`print-page print-page-${profile.id}`}>
      <style>{`@media print { @page { size: ${profile.pageSize} ${profile.orientation}; margin: 0; } }`}</style>
      <header className="print-toolbar no-print">
        <Link className="secondary-button" href={`/projects/${project.id}`}>
          К редактору
        </Link>
        <div>
          <strong>{profile.name}</strong>
          <span>Версия {gameVersion.version} сохранена и подготовлена для печати</span>
        </div>
        <PrintButton />
      </header>
      <nav className="print-profile-switcher no-print" aria-label="Профиль печати">
        {printProfiles.map((printProfile) => (
          <Link
            className={
              profile.id === printProfile.id ? "profile-link profile-link-active" : "profile-link"
            }
            href={
              printProfile.id === "a4-home"
                ? `/projects/${project.id}/print`
                : `/projects/${project.id}/print?profile=${printProfile.id}`
            }
            key={printProfile.id}
          >
            {profileLabel(printProfile)}
          </Link>
        ))}
      </nav>

      {!validation.isPrintable ? (
        <section className="print-warning no-print">
          <h1>Комплект пока нельзя напечатать</h1>
          <ul>
            {validation.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <Link className="secondary-button" href={`/projects/${project.id}`}>
            Исправить игру
          </Link>
        </section>
      ) : (
        <div className="print-document">
          {isPropertyEconomyGame(design) ? (
            <EconomicPrintKit
              design={design}
              profile={profile}
              projectTitle={project.title}
              version={gameVersion.version}
            />
          ) : (
            <>
              <section className="print-sheet print-cover">
                <span className="eyebrow">MYBOARD.AI · печатный комплект</span>
                <h1>{project.title}</h1>
                <p>{gameVersion.content.concept}</p>
                <dl className="print-meta">
                  <div>
                    <dt>Игроки</dt>
                    <dd>{gameVersion.content.playerCount}</dd>
                  </div>
                  <div>
                    <dt>Длительность</dt>
                    <dd>{gameVersion.content.duration}</dd>
                  </div>
                  <div>
                    <dt>Комплект</dt>
                    <dd>
                      {getPrintSheetCount(gameVersion.content, profile)} листа {profile.pageSize}
                    </dd>
                  </div>
                </dl>
                <div className="print-version">Версия игры {gameVersion.version}</div>
              </section>

              {board && printableBoard && isLargeBoard ? (
                boardTiles(profile).map((tile) => (
                  <section className="print-sheet print-board-tile" key={`tile-${tile.index}`}>
                    <div className="print-tile-heading">
                      <span>{board.title}</span>
                      <strong>
                        Лист {tile.index + 1} из{" "}
                        {profile.boardTiles.columns * profile.boardTiles.rows}
                      </strong>
                    </div>
                    <div className="print-tile-window">
                      <div
                        aria-label={`Фрагмент поля: ряд ${tile.row + 1}, колонка ${tile.column + 1}`}
                        className="print-board print-board-large"
                        style={{
                          gridTemplateColumns: `repeat(${printableBoard.side}, 1fr)`,
                          gridTemplateRows: `repeat(${printableBoard.side}, 1fr)`,
                          transform: `translate(-${(tile.column * profile.boardTiles.boardSizeMm) / profile.boardTiles.columns}mm, -${(tile.row * profile.boardTiles.boardSizeMm) / profile.boardTiles.rows}mm)`
                        }}
                      >
                        {printableBoard.spaces.map((space) => (
                          <span className={space > board.spaces ? "board-blank" : ""} key={space}>
                            {space <= board.spaces ? space : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="print-cut-guide" aria-hidden="true">
                      <span>✂ СОВМЕСТИТЬ С СОСЕДНИМ ЛИСТОМ · НАХЛЁСТ {profile.bleedMm} мм</span>
                    </div>
                  </section>
                ))
              ) : board ? (
                <section className="print-sheet print-board-sheet">
                  <span className="eyebrow">Игровое поле</span>
                  <h2>{board.title}</h2>
                  <p className="print-objective">Цель: {gameVersion.content.objective}</p>
                  <div className="print-board" aria-label={`Поле из ${board.spaces} клеток`}>
                    {spaces(board.spaces).map((space) => (
                      <span key={space}>{space}</span>
                    ))}
                  </div>
                  <section className="print-rules">
                    <h3>Правила</h3>
                    <p>{gameVersion.content.rules}</p>
                  </section>
                </section>
              ) : null}

              {gameMode === "adventure" ? (
                <section className="print-sheet print-rules">
                  <span className="eyebrow">Сценарий приключения</span>
                  <h2>{design.scenario?.title ?? project.title}</h2>
                  <p>{design.scenario?.hook ?? design.concept}</p>
                  <ol>
                    {(design.scenario?.stages ?? []).map((stage) => (
                      <li key={stage}>{stage}</li>
                    ))}
                  </ol>
                  {design.roles?.length ? (
                    <div className="print-meta">
                      {design.roles.map((role) => (
                        <div key={role.name}>
                          <dt>{role.name}</dt>
                          <dd>{role.ability}</dd>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {cardSheets(gameVersion.content.cards, profile.cardColumns * 3).map(
                (sheet, sheetIndex) => (
                  <section className="print-card-sheet" key={`sheet-${sheetIndex}`}>
                    {sheet.map((card, index) => (
                      <article className="print-card" key={card.id}>
                        <span className="print-card-type">{card.category}</span>
                        <h2>{card.title}</h2>
                        <p>{card.text}</p>
                        <small>
                          MYBOARD.AI · {sheetIndex * profile.cardColumns * 3 + index + 1}
                        </small>
                      </article>
                    ))}
                  </section>
                )
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
