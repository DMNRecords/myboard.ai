import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  formatAssets,
  formatCards,
  getGameMode,
  hasGameBoard
} from "@/modules/game-design/domain/game-design";
import {
  getAvailableVisualKinds,
  getInitialGameVisualKinds
} from "@/modules/assets/domain/game-visual";
import {
  getGameVersions,
  getLatestGameVersion
} from "@/modules/game-design/application/get-latest-game-version";
import { getOwnedProjectById } from "@/modules/projects/application/get-owned-projects";
import {
  audienceNames,
  gameTypeNames,
  getProjectBrief,
  getProjectIdea
} from "@/modules/projects/domain/game-brief";

import { restoreGameVersionAction, saveGameDesignAction } from "./actions";
import { generateGameVisualAction } from "./asset-actions";
import { FirstGameGenerator } from "./first-game-generator";
import { GameWorkspacePreview } from "./game-workspace-preview";
import { InitialVisualGenerator } from "./initial-visual-generator";
import { PendingSubmitButton } from "../../pending-submit-button";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const notices: Record<string, string> = {
  failed: "Не удалось сохранить версию. Проверьте поля и попробуйте ещё раз.",
  aiFailed: "AI не ответил. Проверьте ключ и модель, затем попробуйте ещё раз.",
  aiGenerated: "AI создал первую версию игры.",
  aiStarter:
    "Создан редактируемый стартовый черновик: бесплатный AI не успел подготовить полный ответ.",
  aiKey: "AI-провайдер отклонил ключ. Проверьте AI_API_KEY в Vercel и выполните Redeploy.",
  aiLimit: "Достигнут лимит бесплатного AI-тарифа. Повторите позже или смените провайдера.",
  aiModerated:
    "Этот запрос не подходит для генерации. Попробуйте безопасную оригинальную идею игры.",
  aiQuota: "Достигнут дневной лимит AI для бета-версии. Попробуйте снова завтра.",
  aiSetup: "AI-провайдер не принял настройки. Проверьте AI_PROVIDER и AI_MODEL в Vercel.",
  imageFailed: "Не удалось создать визуал. Повторите попытку немного позже.",
  imageKey: "Провайдер изображений отклонил ключ. Проверьте IMAGE_API_KEY в Vercel.",
  imageLimit: "Провайдер изображений временно ограничил запросы. Повторите позже.",
  imageModerated:
    "Идея не подходит для генерации визуала. Попробуйте безопасное оригинальное описание.",
  imageQuota: "Достигнут дневной лимит генерации визуалов для бета-версии.",
  imageSetup:
    "Генерация изображений ещё не настроена. Добавьте IMAGE_PROVIDER, IMAGE_API_KEY и IMAGE_MODEL в Vercel.",
  imageSetupAccount: "Не найден IMAGE_CLOUDFLARE_ACCOUNT_ID в настройках Preview Vercel.",
  imageSetupKey: "Не найден IMAGE_API_KEY в настройках Preview Vercel.",
  imageSetupModel: "Не найден IMAGE_MODEL в настройках Preview Vercel.",
  imageSetupProvider: "IMAGE_PROVIDER должен быть равен cloudflare или openai.",
  imageCreated: "AI-визуал создан и добавлен как новая версия игры.",
  restored: "Выбранная версия восстановлена как новая версия игры.",
  saved: "Новая версия игры сохранена."
};

async function saveDesignFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await saveGameDesignAction(formData);
  const projectId = formData.get("projectId");
  redirect(`/projects/${projectId}?notice=${result.status === "success" ? "saved" : "failed"}`);
}

async function restoreVersionFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await restoreGameVersionAction(formData);
  const projectId = formData.get("projectId");
  redirect(`/projects/${projectId}?notice=${result.status === "success" ? "restored" : "failed"}`);
}

async function generateGameVisualFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await generateGameVisualAction(formData);
  const projectId = formData.get("projectId");
  redirect(
    `/projects/${projectId}?notice=${result.status === "success" ? "imageCreated" : result.notice}`
  );
}

export default async function ProjectEditorPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ autogenerate?: string | string[]; notice?: string | string[] }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const [project, gameVersion, gameVersions, query] = await Promise.all([
    getOwnedProjectById(user.id, projectId),
    getLatestGameVersion(user.id, projectId),
    getGameVersions(user.id, projectId),
    searchParams
  ]);

  if (!project) {
    notFound();
  }

  const notice = typeof query.notice === "string" ? notices[query.notice] : undefined;
  const design = gameVersion?.content;
  const projectIdea = getProjectIdea(project.description) || project.title;
  const projectBrief = getProjectBrief(project.description);
  const gameMode = design ? getGameMode(design) : (projectBrief?.gameType ?? "board");
  const hasBoard = design ? hasGameBoard(design) : false;
  const visualKinds = getAvailableVisualKinds(gameMode);
  const initialVisualKinds =
    design && !design.assets?.length
      ? getInitialGameVisualKinds({
          idea: projectIdea,
          design,
          mode: gameMode
        })
      : [];

  return (
    <main className={`studio-editor-page builder-style-${project.style ?? "classic"}`}>
      <header className="studio-editor-header">
        <Link className="marketing-brand" href="/projects">
          <span aria-hidden="true" className="brand-die">
            ✦
          </span>
          <span>
            MYBOARD<span>.AI</span>
            <small>Ваша идея. Ваша игра.</small>
          </span>
        </Link>
        <span className="studio-editor-project-name">{project.title}</span>
        <Link className="studio-signout" href="/projects">
          К проектам
        </Link>
      </header>

      <section className="studio-editor-intro" id="editor-overview">
        <span className="section-kicker">КОНСТРУКТОР ИГРЫ</span>
        <h1>{project.title}</h1>
        <p>{projectIdea}</p>
        <div className="studio-editor-meta">
          <span>{project.style ? `Стиль: ${project.style}` : "Стиль не выбран"}</span>
          {projectBrief ? <span>{gameTypeNames[projectBrief.gameType]}</span> : null}
          {projectBrief ? <span>{projectBrief.players} игроков</span> : null}
          {projectBrief ? <span>{audienceNames[projectBrief.audience]}</span> : null}
          <span>Версия {gameVersion?.version ?? 0}</span>
          <span>{project.language.toUpperCase()}</span>
        </div>
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}
      </section>

      {!design ? (
        <section className="studio-empty-design" aria-labelledby="first-game-title">
          <span aria-hidden="true">✦</span>
          <h2 id="first-game-title">AI соберёт вашу первую игру</h2>
          <p>
            Ваша идея сохранена. AI подготовит правила и только нужные для выбранного формата
            компоненты — например, поле, колоду, сценарий или ресурсы. Обычно это занимает до
            минуты.
          </p>
          <ol className="creation-steps">
            <li>Продумываем механику и состав игры</li>
            <li>Собираем поле, правила и карточки</li>
            <li>Оформляем компоненты в едином стиле</li>
          </ol>
          <FirstGameGenerator autoStart={query.autogenerate === "1"} projectId={project.id} />
        </section>
      ) : (
        <div className="builder-shell">
          <aside className="builder-sidebar" aria-label="Разделы конструктора">
            <span>РАЗДЕЛЫ ИГРЫ</span>
            <a href="#editor-overview">Идея и стиль</a>
            <a href="#editor-rules">Правила</a>
            {hasBoard ? <a href="#editor-board">Игровое поле</a> : null}
            <a href="#editor-cards">
              {gameMode === "adventure"
                ? "Сцены и встречи"
                : gameMode === "party"
                  ? "Раунды и задания"
                  : "Карточки"}
            </a>
            <a href="#editor-print">Печать</a>
          </aside>
          <div className="editor-layout studio-editor-layout">
            <details className="builder-details">
              <summary>
                <span>Ручная настройка</span>
                <strong>Изменить правила, поле и карточки</strong>
                <small>Нужно только если хотите поправить первую версию от AI.</small>
              </summary>
              <form action={saveDesignFromForm} className="design-form">
                <input name="projectId" type="hidden" value={project.id} />
                <h2>Содержание версии {gameVersion.version + 1}</h2>
                <label id="editor-rules">
                  Концепция
                  <textarea
                    name="concept"
                    defaultValue={design.concept}
                    maxLength={1000}
                    required
                  />
                </label>
                <label>
                  Цель игры
                  <textarea
                    name="objective"
                    defaultValue={design.objective}
                    maxLength={500}
                    required
                  />
                </label>
                <div className="editor-two-columns" id="editor-board">
                  <label>
                    Игроки
                    <input
                      name="playerCount"
                      defaultValue={design.playerCount}
                      maxLength={80}
                      required
                    />
                  </label>
                  <label>
                    Длительность
                    <input name="duration" defaultValue={design.duration} maxLength={80} required />
                  </label>
                </div>
                <label id="editor-cards">
                  Правила
                  <textarea name="rules" defaultValue={design.rules} maxLength={5000} required />
                </label>
                {hasGameBoard(design) ? (
                  <div className="editor-two-columns">
                    <label>
                      Название поля
                      <input
                        name="boardTitle"
                        defaultValue={design.board.title}
                        maxLength={120}
                        required
                      />
                    </label>
                    <label>
                      Клеток на поле
                      <input
                        name="boardSpaces"
                        defaultValue={design.board.spaces}
                        inputMode="numeric"
                        required
                      />
                    </label>
                  </div>
                ) : null}
                <label>
                  Карточки
                  <textarea name="cards" defaultValue={formatCards(design.cards)} required />
                  <span className="field-hint">
                    Одна карточка на строку: «Название | Текст карточки».
                  </span>
                </label>
                <label>
                  Ресурсы и изображения
                  <textarea
                    name="assets"
                    defaultValue={formatAssets(design.assets ?? [])}
                    placeholder="Название | https://example.com/image.jpg | Для поля или карточки"
                  />
                  <span className="field-hint">
                    Одна ссылка на строку: «Название | URL изображения | Описание».
                  </span>
                </label>
                <PendingSubmitButton pendingLabel="Сохраняем новую версию…">
                  Сохранить новой версией
                </PendingSubmitButton>
                <Link
                  className="secondary-button"
                  href={`/projects/${project.id}/print`}
                  id="editor-print"
                >
                  Сделать PDF для печати
                </Link>
              </form>
            </details>

            <aside className="game-preview builder-preview" aria-label="Предпросмотр игры">
              <InitialVisualGenerator projectId={project.id} kinds={initialVisualKinds} />
              <span className="eyebrow">Предпросмотр</span>
              <h2>{project.title}</h2>
              <p>{design.concept}</p>
              <dl className="game-meta">
                <div>
                  <dt>Игроки</dt>
                  <dd>{design.playerCount}</dd>
                </div>
                <div>
                  <dt>Время</dt>
                  <dd>{design.duration}</dd>
                </div>
              </dl>
              <GameWorkspacePreview design={design} />
              <h3>Ресурсы</h3>
              <form action={generateGameVisualFromForm} className="visual-generator">
                <input name="projectId" type="hidden" value={project.id} />
                <label>
                  Создать в едином стиле
                  <select defaultValue="cover" name="kind">
                    {visualKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind === "cover"
                          ? "Обложка игры"
                          : kind === "box"
                            ? "Коробка"
                            : kind === "board"
                              ? "Игровое поле"
                              : kind === "cards"
                                ? "Набор карточек"
                                : kind === "tokens"
                                  ? "Фишки и жетоны"
                                  : "Игровая валюта"}
                      </option>
                    ))}
                  </select>
                </label>
                <PendingSubmitButton className="secondary-button" pendingLabel="AI рисует визуал…">
                  Создать визуал с AI
                </PendingSubmitButton>
              </form>
              {design.assets?.length ? (
                <div className="asset-grid">
                  {design.assets.map((asset) => (
                    <a
                      className="game-asset"
                      href={asset.url}
                      key={asset.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- image URLs come from user assets or Supabase Storage. */}
                      <img alt="" src={asset.url} />
                      <span>{asset.title}</span>
                      <small>{asset.description}</small>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="empty-assets">
                  Добавьте ссылки на ваши изображения, чтобы использовать их в следующей версии
                  игры.
                </p>
              )}
            </aside>
          </div>
        </div>
      )}
      {gameVersions.length ? (
        <section
          className="version-history studio-version-history"
          aria-labelledby="version-history-title"
        >
          <div>
            <span className="eyebrow">История</span>
            <h2 id="version-history-title">Версии игры</h2>
          </div>
          <div className="version-list">
            {gameVersions.map((version) => (
              <article className="version-item" key={version.id}>
                <div>
                  <strong>Версия {version.version}</strong>
                  <span>{version.createdAt.toLocaleString("ru-RU")}</span>
                </div>
                <form action={restoreVersionFromForm}>
                  <input name="projectId" type="hidden" value={project.id} />
                  <input name="versionId" type="hidden" value={version.id} />
                  <PendingSubmitButton className="secondary-button" pendingLabel="Восстанавливаем…">
                    Восстановить как новую
                  </PendingSubmitButton>
                </form>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
