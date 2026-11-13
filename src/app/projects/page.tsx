import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getOwnedProjects } from "@/modules/projects/application/get-owned-projects";
import { getProjectIdea } from "@/modules/projects/domain/game-brief";

import { archiveProjectAction, deleteProjectAction, renameProjectAction } from "./actions";
import { GameCreatorWizard } from "./game-creator-wizard";
import { signOutAction } from "../login/actions";

export const dynamic = "force-dynamic";

async function renameProjectFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await renameProjectAction(formData);
  redirect(`/projects?notice=${result.status === "success" ? "renamed" : "failed"}`);
}

async function archiveProjectFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await archiveProjectAction(formData);
  redirect(`/projects?notice=${result.status === "success" ? "archived" : "failed"}`);
}

async function deleteProjectFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await deleteProjectAction(formData);
  redirect(`/projects?notice=${result.status === "success" ? "deleted" : "failed"}`);
}

const notices: Record<string, string> = {
  archived: "Проект архивирован.",
  deleted: "Проект удалён.",
  failed: "Не удалось изменить проект. Попробуйте ещё раз.",
  renamed: "Название проекта обновлено."
};

const styleNames: Record<string, string> = {
  anime: "Аниме",
  classic: "Классика",
  comic: "Комикс",
  future: "Футуризм",
  noir: "Нуар",
  retro: "Ретро"
};

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await getOwnedProjects(user.id);
  const { notice } = await searchParams;
  const message = typeof notice === "string" ? notices[notice] : undefined;

  return (
    <main className="studio-projects-page">
      <header className="studio-app-header">
        <Link className="marketing-brand" href="/">
          <span aria-hidden="true" className="brand-die">
            ✦
          </span>
          <span>
            MYBOARD<span>.AI</span>
            <small>Ваша идея. Ваша игра.</small>
          </span>
        </Link>
        <span className="studio-page-name">Мои игры</span>
        <form action={signOutAction}>
          <button className="studio-signout" type="submit">
            Выйти
          </button>
        </form>
      </header>

      <section className="studio-projects-intro" aria-labelledby="projects-title">
        <p className="section-kicker">МОЯ ИГРОВАЯ СТУДИЯ</p>
        <h1 id="projects-title">С чего начнём новую игру?</h1>
        <p>Сначала задайте идею, затем выберите формат, стиль и компанию — остальное соберёт AI.</p>
        {message ? (
          <p className="notice" role="status">
            {message}
          </p>
        ) : null}
      </section>

      <section className="idea-start" aria-label="Новая идея игры">
        <GameCreatorWizard />
      </section>

      <section className="my-projects-section" aria-label="Проекты">
        <div className="my-projects-heading">
          <h2>Мои игры</h2>
          <span>
            {projects.length} {projects.length === 1 ? "проект" : "проекта"}
          </span>
        </div>
        <div className="studio-project-grid">
          {projects.map((project) => (
            <article className="studio-project-card" key={project.id}>
              <div
                className={`project-art project-art-${project.style ?? "classic"}`}
                aria-hidden="true"
              >
                <span>✦</span>
              </div>
              <div className="studio-project-card-body">
                <div>
                  <span className="studio-project-status">
                    {project.status === "draft" ? "В работе" : "В архиве"}
                  </span>
                  <span className="studio-project-style">
                    {project.style ? styleNames[project.style] : "Без стиля"}
                  </span>
                </div>
                <h3>{project.title}</h3>
                <p>{getProjectIdea(project.description) || "Идея игры ещё не описана."}</p>
                <Link className="marketing-secondary-cta" href={`/projects/${project.id}`}>
                  Открыть конструктор <span aria-hidden="true">→</span>
                </Link>
              </div>
              <details className="project-card-actions">
                <summary>⋯</summary>
                <form action={renameProjectFromForm}>
                  <input name="projectId" type="hidden" value={project.id} />
                  <input
                    aria-label="Новое название"
                    name="title"
                    defaultValue={project.title}
                    maxLength={120}
                    required
                  />
                  <button className="text-button" type="submit">
                    Переименовать
                  </button>
                </form>
                {project.status === "draft" ? (
                  <form action={archiveProjectFromForm}>
                    <input name="projectId" type="hidden" value={project.id} />
                    <button className="text-button" type="submit">
                      В архив
                    </button>
                  </form>
                ) : null}
                <form action={deleteProjectFromForm}>
                  <input name="projectId" type="hidden" value={project.id} />
                  <button className="text-button project-delete" type="submit">
                    Удалить
                  </button>
                </form>
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
