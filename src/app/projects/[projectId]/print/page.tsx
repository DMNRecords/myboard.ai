import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getLatestGameVersion } from "@/modules/game-design/application/get-latest-game-version";
import {
  a4LargeBoardPrintProfile,
  a4HomePrintProfile,
  getPrintSheetCount,
  validatePrintableGame
} from "@/modules/exports/domain/print-profile";
import { getOwnedProjectById } from "@/modules/projects/application/get-owned-projects";

import { PrintButton } from "./print-button";

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
  const profile = query.profile === "large-board" ? a4LargeBoardPrintProfile : a4HomePrintProfile;
  const isLargeBoard = profile.id === "a4-large-board";
  const printableBoard = largeBoardSpaces(gameVersion.content.board.spaces);

  return (
    <main className="print-page">
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
        <Link
          className={profile.id === "a4-home" ? "profile-link profile-link-active" : "profile-link"}
          href={`/projects/${project.id}/print`}
        >
          Стандарт A4
        </Link>
        <Link
          className={
            profile.id === "a4-large-board" ? "profile-link profile-link-active" : "profile-link"
          }
          href={`/projects/${project.id}/print?profile=large-board`}
        >
          Большое поле 50 × 50 см
        </Link>
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
                <dd>{getPrintSheetCount(gameVersion.content, profile)} листа A4</dd>
              </div>
            </dl>
            <div className="print-version">Версия игры {gameVersion.version}</div>
          </section>

          {isLargeBoard ? (
            boardTiles(profile).map((tile) => (
              <section className="print-sheet print-board-tile" key={`tile-${tile.index}`}>
                <div className="print-tile-heading">
                  <span>{gameVersion.content.board.title}</span>
                  <strong>
                    Лист {tile.index + 1} из {profile.boardTiles.columns * profile.boardTiles.rows}
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
                      <span
                        className={space > gameVersion.content.board.spaces ? "board-blank" : ""}
                        key={space}
                      >
                        {space <= gameVersion.content.board.spaces ? space : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="print-cut-guide" aria-hidden="true">
                  <span>✂ СОВМЕСТИТЬ С СОСЕДНИМ ЛИСТОМ · НАХЛЁСТ {profile.bleedMm} мм</span>
                </div>
              </section>
            ))
          ) : (
            <section className="print-sheet print-board-sheet">
              <span className="eyebrow">Игровое поле</span>
              <h2>{gameVersion.content.board.title}</h2>
              <p className="print-objective">Цель: {gameVersion.content.objective}</p>
              <div
                className="print-board"
                aria-label={`Поле из ${gameVersion.content.board.spaces} клеток`}
              >
                {spaces(gameVersion.content.board.spaces).map((space) => (
                  <span key={space}>{space}</span>
                ))}
              </div>
              <section className="print-rules">
                <h3>Правила</h3>
                <p>{gameVersion.content.rules}</p>
              </section>
            </section>
          )}

          {cardSheets(gameVersion.content.cards, profile.cardColumns * 3).map(
            (sheet, sheetIndex) => (
              <section className="print-card-sheet" key={`sheet-${sheetIndex}`}>
                {sheet.map((card, index) => (
                  <article className="print-card" key={card.id}>
                    <span className="print-card-type">{card.category}</span>
                    <h2>{card.title}</h2>
                    <p>{card.text}</p>
                    <small>MYBOARD.AI · {sheetIndex * profile.cardColumns * 3 + index + 1}</small>
                  </article>
                ))}
              </section>
            )
          )}
        </div>
      )}
    </main>
  );
}
