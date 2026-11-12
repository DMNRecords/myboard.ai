"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAiProviderConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGameDesignerInstructions, normalizeChatPrompt } from "@/modules/ai/domain/chat";
import { createOwnedAiMessage } from "@/modules/ai/data/supabase-ai-message-repository";
import { generateGameDesignerReply } from "@/modules/ai/data/openai-responses-provider";
import { getOwnedProject } from "@/modules/projects/data/supabase-project-repository";

export type AiActionResult = { status: "success" } | { status: "error"; message: string };

function getFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function sendAiMessageAction(formData: FormData): Promise<AiActionResult> {
  const user = await getCurrentUser();
  const projectId = getFormValue(formData, "projectId");

  if (!user || !projectId) {
    return { status: "error", message: "Войдите в аккаунт, чтобы пользоваться AI-чатом." };
  }

  if (!hasAiProviderConfig()) {
    return {
      status: "error",
      message: "AI-провайдер, ключ или модель ещё не настроены на сервере."
    };
  }

  try {
    const content = normalizeChatPrompt(getFormValue(formData, "message"));
    const database = await createSupabaseServerClient();
    const project = await getOwnedProject(database, { ownerId: user.id, projectId });

    if (!project) {
      return { status: "error", message: "Проект не найден или недоступен." };
    }

    await createOwnedAiMessage(database, {
      ownerId: user.id,
      projectId,
      role: "user",
      content
    });
    const reply = await generateGameDesignerReply({
      instructions: createGameDesignerInstructions(project.title),
      message: content
    });
    await createOwnedAiMessage(database, {
      ownerId: user.id,
      projectId,
      role: "assistant",
      content: reply
    });
    revalidatePath(`/projects/${projectId}`);
    return { status: "success" };
  } catch {
    return { status: "error", message: "Не удалось получить ответ AI. Попробуйте ещё раз позже." };
  }
}
