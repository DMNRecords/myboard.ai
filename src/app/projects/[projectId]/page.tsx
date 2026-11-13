import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getAiMessages } from "@/modules/ai/application/get-ai-messages";
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
import { generateFirstGameAction, sendAiMessageAction } from "./ai-actions";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  failed: "Не удалось сохранить версию. Проверьте поля и попробуйте ещё раз.",
  aiFailed: "AI не ответил. Проверьте ключ и модель, затем попробуйте ещё раз.",
  aiGenerated: "AI создал первую версию игры.",
  aiKey: "AI-провайдер отклонил ключ. Проверьте AI_API_KEY в Vercel и выполните Redeploy.",
  aiLimit: "Достигнут лимит бесплатного AI-тарифа. Повторите позже или смените провайдера.",
  aiModerated:
    "Этот запрос не подходит для генерации. Попробуйте безопасную оригинальную идею игры.",
  aiQuota: "Достигнут дневной лимит AI для бета-версии. Попробуйте снова завтра.",
  aiSetup: "AI-провайдер не принял настройки. Проверьте AI_PROVIDER и AI_MODEL в Vercel.",
  aiSent: "AI-ответ добавлен в историю чата.",
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

async function sendAiMessageFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await sendAiMessageAction(formData);
  const projectId = formData.get("projectId");
  redirect(
    `/projects/${projectId}?notice=${result.status === "success" ? "aiSent" : result.notice}`
  );
}

async function generateFirstGameFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await generateFirstGameAction(formData);
  const projectId = formData.get("projectId");
  redirect(
    `/projects/${projectId}?notice=${result.status === "success" ? "aiGenerated" : result.notice}`
  );
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
  const [project, gameVersion, gameVersions, messages, query] = await Promise.all([
    getOwnedProjectById(user.id, projectId),
    getLatestGameVersion(user.id, projectId),
    getGameVersions(user.id, projectId),
    getAiMessages(user.id, projectId),
    searchParams
  ]);

  if (!project) {
    notFound();
  }

  const notice = typeof query.notice === "string" ? notices[query.notice] : undefined;
  const design = gameVersion?.content;

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
        <p>{project.description ?? "Добавьте идею, чтобы AI помог собрать первую версию игры."}</p>
        <div className="studio-editor-meta">
          <span>{project.style ? `Стиль: ${project.style}` : "Стиль не выбран"}</span>
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
        <section className="studio-empty-design" aria-labelledby="template-title">
          <span aria-hidden="true">✦</span>
          <h2 id="template-title">Соберём первую версию игры</h2>
          <p>
            Начните диалог с AI‑дизайнером ниже: он уточнит идею и предложит оригинальные правила,
            поле и карточки. Для знакомства также доступен стартовый шаблон Темиртау.
          </p>
          <form action={generateFirstGameFromForm}>
            <input name="projectId" type="hidden" value={project.id} />
            <button className="cta" type="submit">
              Создать первую версию с AI
            </button>
          </form>
          <form action={createTemplateFromForm}>
            <input name="projectId" type="hidden" value={project.id} />
            <button className="cta" type="submit">
              Открыть шаблон Темиртау
            </button>
          </form>
        </section>
      ) : (
        <div className="builder-shell">
          <aside className="builder-sidebar" aria-label="Разделы конструктора">
            <span>РАЗДЕЛЫ ИГРЫ</span>
            <a href="#editor-overview">Идея и стиль</a>
            <a href="#editor-rules">Правила</a>
            <a href="#editor-board">Игровое поле</a>
            <a href="#editor-cards">Карточки</a>
            <a href="#editor-print">Печать</a>
            <a href="#ai-designer">AI‑дизайнер</a>
          </aside>
          <div className="editor-layout studio-editor-layout">
            <form action={saveDesignFromForm} className="design-form">
              <input name="projectId" type="hidden" value={project.id} />
              <h2>Содержание версии {gameVersion.version + 1}</h2>
              <label id="editor-rules">
                Концепция
                <textarea name="concept" defaultValue={design.concept} maxLength={1000} required />
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
              <Link
                className="secondary-button"
                href={`/projects/${project.id}/print`}
                id="editor-print"
              >
                Предпросмотр печати A4
              </Link>
            </form>

            <aside className="game-preview builder-preview" aria-label="Предпросмотр игры">
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
                  <button className="secondary-button" type="submit">
                    Восстановить как новую
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="ai-chat studio-ai-chat" id="ai-designer" aria-labelledby="ai-chat-title">
        <div>
          <span className="eyebrow">AI-дизайнер</span>
          <h2 id="ai-chat-title">Обсудите идею игры</h2>
          <p>
            AI предложит оригинальные механики, правила или следующий шаг. Ответы не меняют игру без
            вашего сохранения.
          </p>
        </div>
        <div className="chat-history" aria-live="polite">
          {messages.length ? (
            messages.map((message) => (
              <article className={`chat-message chat-message-${message.role}`} key={message.id}>
                <strong>{message.role === "user" ? "Вы" : "MYBOARD AI"}</strong>
                <p>{message.content}</p>
              </article>
            ))
          ) : (
            <p className="empty-assets">
              Например: «Придумай три оригинальные механики для семейной игры о Темиртау».
            </p>
          )}
        </div>
        <form action={sendAiMessageFromForm} className="chat-form">
          <input name="projectId" type="hidden" value={project.id} />
          <label>
            Сообщение для AI
            <textarea
              name="message"
              maxLength={2000}
              placeholder="Опишите идею или задайте вопрос…"
              required
            />
          </label>
          <button className="cta" type="submit">
            Спросить AI
          </button>
        </form>
      </section>
    </main>
  );
}
