import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getOwnedProjects } from "@/modules/projects/application/get-owned-projects";

import {
  archiveProjectAction,
  createProjectAction,
  deleteProjectAction,
  renameProjectAction
} from "./actions";
import { signOutAction } from "../login/actions";

export const dynamic = "force-dynamic";

async function createProjectFromForm(formData: FormData): Promise<void> {
  "use server";
  const result = await createProjectAction(formData);
  redirect(`/projects?notice=${result.status === "success" ? "created" : "failed"}`);
}

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
  created: "Черновик игры создан.",
  deleted: "Проект удалён.",
  failed: "Не удалось изменить проект. Попробуйте ещё раз.",
  renamed: "Название проекта обновлено."
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
    <main className="projects-page">
      <header className="projects-header">
        <Link className="brand" href="/">
          MYBOARD.AI
        </Link>
        <form action={signOutAction}>
          <button className="secondary-button" type="submit">
            Выйти
          </button>
        </form>
      </header>
      <section className="projects-intro" aria-labelledby="projects-title">
        <span className="eyebrow">Мои игры</span>
        <h1 id="projects-title">Ваши проекты</h1>
        <p>Начните с идеи — детали игры можно будет развить на следующих шагах.</p>
        {message ? (
          <p className="notice" role="status">
            {message}
          </p>
        ) : null}
      </section>
      <section className="project-grid" aria-label="Проекты">
        <form action={createProjectFromForm} className="project-card project-card-create">
          <h2>Новая игра</h2>
          <label>
            Название
            <input
              name="title"
              maxLength={120}
              placeholder="Например, Темиртау: история города"
              required
            />
          </label>
          <label>
            Язык
            <select name="language" defaultValue="ru">
              <option value="ru">Русский</option>
              <option value="kk">Қазақша</option>
              <option value="en">English</option>
            </select>
          </label>
          <button className="cta" type="submit">
            Создать черновик
          </button>
        </form>
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <span className="project-status">
              {project.status === "draft" ? "Черновик" : "В архиве"}
            </span>
            <form action={renameProjectFromForm} className="project-rename-form">
              <input name="projectId" type="hidden" value={project.id} />
              <label>
                Название проекта
                <input name="title" defaultValue={project.title} maxLength={120} required />
              </label>
              <button className="text-button" type="submit">
                Переименовать
              </button>
            </form>
            <p>{project.language.toUpperCase()}</p>
            {project.status === "draft" ? (
              <form action={archiveProjectFromForm}>
                <input name="projectId" type="hidden" value={project.id} />
                <button className="secondary-button" type="submit">
                  В архив
                </button>
              </form>
            ) : null}
            <form action={deleteProjectFromForm}>
              <input name="projectId" type="hidden" value={project.id} />
              <button className="danger-button" type="submit">
                Удалить
              </button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
