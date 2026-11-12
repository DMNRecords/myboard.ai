"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveOwnedProject,
  createOwnedProject,
  deleteOwnedProject,
  renameOwnedProject
} from "@/modules/projects/data/supabase-project-repository";
import { isProjectLanguage, normalizeProjectTitle } from "@/modules/projects/domain/project";

export type ProjectActionResult =
  { status: "error"; message: string } | { status: "success"; message: string };

function getFormString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

async function getActionContext(): Promise<{
  database: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
} | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return { database: await createSupabaseServerClient(), userId: user.id };
}

function invalidProjectResult(): ProjectActionResult {
  return { status: "error", message: "Проверьте данные проекта и попробуйте снова." };
}

function unavailableProjectResult(): ProjectActionResult {
  return { status: "error", message: "Проект не найден или недоступен." };
}

export async function createProjectAction(formData: FormData): Promise<ProjectActionResult> {
  const context = await getActionContext();

  if (!context) {
    return { status: "error", message: "Для создания проекта войдите в аккаунт." };
  }

  const language = getFormString(formData, "language");

  if (!isProjectLanguage(language)) {
    return invalidProjectResult();
  }

  try {
    await createOwnedProject(context.database, {
      ownerId: context.userId,
      title: normalizeProjectTitle(getFormString(formData, "title")),
      language
    });
    revalidatePath("/projects");
    return { status: "success", message: "Проект создан." };
  } catch {
    return { status: "error", message: "Не удалось создать проект. Повторите попытку." };
  }
}

export async function renameProjectAction(formData: FormData): Promise<ProjectActionResult> {
  const context = await getActionContext();

  if (!context) {
    return { status: "error", message: "Для изменения проекта войдите в аккаунт." };
  }

  const projectId = getFormString(formData, "projectId");

  if (!projectId) {
    return invalidProjectResult();
  }

  try {
    const project = await renameOwnedProject(context.database, {
      ownerId: context.userId,
      projectId,
      title: normalizeProjectTitle(getFormString(formData, "title"))
    });

    if (!project) {
      return unavailableProjectResult();
    }

    revalidatePath("/projects");
    return { status: "success", message: "Название проекта обновлено." };
  } catch {
    return { status: "error", message: "Не удалось обновить проект. Повторите попытку." };
  }
}

export async function archiveProjectAction(formData: FormData): Promise<ProjectActionResult> {
  const context = await getActionContext();
  const projectId = getFormString(formData, "projectId");

  if (!context) {
    return { status: "error", message: "Для архивирования проекта войдите в аккаунт." };
  }

  if (!projectId) {
    return invalidProjectResult();
  }

  try {
    const project = await archiveOwnedProject(context.database, {
      ownerId: context.userId,
      projectId,
      archivedAt: new Date()
    });

    if (!project) {
      return unavailableProjectResult();
    }

    revalidatePath("/projects");
    return { status: "success", message: "Проект архивирован." };
  } catch {
    return { status: "error", message: "Не удалось архивировать проект. Повторите попытку." };
  }
}

export async function deleteProjectAction(formData: FormData): Promise<ProjectActionResult> {
  const context = await getActionContext();
  const projectId = getFormString(formData, "projectId");

  if (!context) {
    return { status: "error", message: "Для удаления проекта войдите в аккаунт." };
  }

  if (!projectId) {
    return invalidProjectResult();
  }

  try {
    const wasDeleted = await deleteOwnedProject(context.database, {
      ownerId: context.userId,
      projectId
    });

    if (!wasDeleted) {
      return unavailableProjectResult();
    }

    revalidatePath("/projects");
    return { status: "success", message: "Проект удалён." };
  } catch {
    return { status: "error", message: "Не удалось удалить проект. Повторите попытку." };
  }
}
