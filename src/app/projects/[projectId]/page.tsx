import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { formatAssets, formatCards } from "@/modules/game-design/domain/game-design";
import {
  getGameVersions,
  getLatestGameVersion
} from "@/modules/game-design/application/get-latest-game-version";
import { getOwnedProjectById } from "@/modules/projects/application/get-owned-projects";

import {
  createTemirtauTemplateAction,
  restoreGameVersionAction,
  saveGameDesignAction
} from "./actions";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  failed: "Не удалось сохранить версию. Проверьте поля и попробуйте ещё раз.",
  restored: "Выбранная версия восстановлена как новая версия игры.",
  saved: "Новая версия игры сохранена.",
  template: "Шаблон «Темиртау» добавлен как первая версия игры."
};

function boardSpaces(spaces: number) {
  return Array.from({ length: spaces }, (_, index) => index + 1);
}

async function createTemplateFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await createTemirtauTemplateAction(formData);
  const projectId = formData.get("projectId");
  redirect(`/projects/${projectId}?notice=${result.status === "success" ? "template" : "failed"}`);
}

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

export default async function ProjectEditorPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ notice?: string | string[] }>;
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

  return (
    <main className="editor-page">
      <header className="projects-header">
        <Link className="brand" href="/projects">
          MYBOARD.AI
        </Link>
        <Link className="secondary-button" href="/projects">
          К проектам
        </Link>
      </header>

      <section className="editor-intro">
        <span className="eyebrow">Редактор игры</span>
        <h1>{project.title}</h1>
        <p>
          Каждое сохранение создаёт отдельную версию. Сейчас доступна версия{" "}
          {gameVersion?.version ?? 0}.
        </p>
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}
      </section>

      {!design ? (
        <section className="empty-design" aria-labelledby="template-title">
          <h2 id="template-title">Начните с оригинального шаблона «Темиртау»</h2>
          <p>
            Он создаст правила, маршрут на 24 клетки и первые три карточки — затем всё можно
            изменить.
          </p>
          <form action={createTemplateFromForm}>
            <input name="projectId" type="hidden" value={project.id} />
            <button className="cta" type="submit">
              Добавить шаблон Темиртау
            </button>
          </form>
        </section>
      ) : (
        <div className="editor-layout">
          <form action={saveDesignFromForm} className="design-form">
            <input name="projectId" type="hidden" value={project.id} />
            <h2>Содержание версии {gameVersion.version + 1}</h2>
            <label>
              Концепция
              <textarea name="concept" defaultValue={design.concept} maxLength={1000} required />
            </label>
            <label>
              Цель игры
              <textarea name="objective" defaultValue={design.objective} maxLength={500} required />
            </label>
            <div className="editor-two-columns">
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
            <label>
              Правила
              <textarea name="rules" defaultValue={design.rules} maxLength={5000} required />
            </label>
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
            <button className="cta" type="submit">
              Сохранить новой версией
            </button>
          </form>

          <aside className="game-preview" aria-label="Предпросмотр игры">
            <span className="eyebrow">Предпросмотр</span>
            <h2>{design.board.title}</h2>
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
            <div className="board-preview" aria-label={`Поле из ${design.board.spaces} клеток`}>
              {boardSpaces(design.board.spaces).map((space) => (
                <span key={space}>{space}</span>
              ))}
            </div>
            <h3>Карточки</h3>
            <div className="card-stack">
              {design.cards.map((card) => (
                <article className="game-card" key={card.id}>
                  <span>{card.category}</span>
                  <h4>{card.title}</h4>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
            <h3>Ресурсы</h3>
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
                    <span>{asset.title}</span>
                    <small>{asset.description}</small>
                  </a>
                ))}
              </div>
            ) : (
              <p className="empty-assets">
                Добавьте ссылки на ваши изображения, чтобы использовать их в следующей версии игры.
              </p>
            )}
          </aside>
        </div>
      )}
      {gameVersions.length ? (
        <section className="version-history" aria-labelledby="version-history-title">
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
                  <button className="secondary-button" type="submit">
                    Восстановить как новую
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
