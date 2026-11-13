"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAiProviderConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImageProviderRequestError } from "@/modules/assets/data/openai-image-provider";
import {
  createGameDesignerInstructions,
  normalizeChatPrompt,
  reviewChatPrompt
} from "@/modules/ai/domain/chat";
import {
  countOwnedAiPromptsSince,
  createModerationEvent,
  createOwnedAiMessage
} from "@/modules/ai/data/supabase-ai-message-repository";
import {
  AiProviderRequestError,
  generateCloudflareGameDesignerReply,
  generateGameDesignerReply
} from "@/modules/ai/data/openai-responses-provider";
import {
  createEditableStarterGame,
  createFirstGameInstructions,
  parseGeneratedGameDesign
} from "@/modules/ai/domain/game-generation";
import { createOwnedGameVersion } from "@/modules/game-design/data/supabase-game-version-repository";
import { getLatestOwnedGameVersion } from "@/modules/game-design/data/supabase-game-version-repository";
import type { GameDesign } from "@/modules/game-design/domain/game-design";
import { getOwnedProject } from "@/modules/projects/data/supabase-project-repository";

export type AiActionResult =
  | { status: "success"; usedStarter?: boolean }
  | {
      status: "error";
      notice: "aiFailed" | "aiKey" | "aiLimit" | "aiQuota" | "aiSetup" | "aiModerated";
    };

// A first game may require a retry while a temporary free provider is busy.
// Keep enough headroom for a real beta session without making the limit open-ended.
const dailyPromptLimit = 20;

function startOfCurrentDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function sendAiMessageAction(formData: FormData): Promise<AiActionResult> {
  const user = await getCurrentUser();
  const projectId = getFormValue(formData, "projectId");

  if (!user || !projectId) {
    return { status: "error", notice: "aiFailed" };
  }

  if (!hasAiProviderConfig()) {
    return { status: "error", notice: "aiSetup" };
  }

  try {
    const content = normalizeChatPrompt(getFormValue(formData, "message"));
    const database = await createSupabaseServerClient();
    const project = await getOwnedProject(database, { ownerId: user.id, projectId });

    if (!project) {
      return { status: "error", notice: "aiFailed" };
    }

    const review = reviewChatPrompt(content);

    if (!review.allowed) {
      await createModerationEvent(database, {
        ownerId: user.id,
        projectId,
        reason: review.reason
      });
      return { status: "error", notice: "aiModerated" };
    }

    const promptCount = await countOwnedAiPromptsSince(database, {
      ownerId: user.id,
      since: startOfCurrentDay()
    });

    if (promptCount >= dailyPromptLimit) {
      return { status: "error", notice: "aiQuota" };
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
  } catch (error) {
    if (error instanceof AiProviderRequestError) {
      if (error.status === 401 || error.status === 403) {
        return { status: "error", notice: "aiKey" };
      }

      if (error.status === 429) {
        return { status: "error", notice: "aiLimit" };
      }

      if (error.status === 400 || error.status === 404) {
        return { status: "error", notice: "aiSetup" };
      }
    }

    return { status: "error", notice: "aiFailed" };
  }
}

export async function generateFirstGameAction(formData: FormData): Promise<AiActionResult> {
  const user = await getCurrentUser();
  const projectId = getFormValue(formData, "projectId");

  if (!user || !projectId || !hasAiProviderConfig()) {
    return { status: "error", notice: "aiSetup" };
  }

  try {
    const database = await createSupabaseServerClient();
    const project = await getOwnedProject(database, { ownerId: user.id, projectId });

    if (!project?.description) {
      return { status: "error", notice: "aiFailed" };
    }

    const review = reviewChatPrompt(project.description);

    if (!review.allowed) {
      await createModerationEvent(database, { ownerId: user.id, projectId, reason: review.reason });
      return { status: "error", notice: "aiModerated" };
    }

    const existingVersion = await getLatestOwnedGameVersion(database, {
      ownerId: user.id,
      projectId
    });

    if (existingVersion) {
      return { status: "error", notice: "aiFailed" };
    }

    const promptCount = await countOwnedAiPromptsSince(database, {
      ownerId: user.id,
      since: startOfCurrentDay()
    });

    if (promptCount >= dailyPromptLimit) {
      return { status: "error", notice: "aiQuota" };
    }

    const generationPrompt = "Создай первую структурированную версию игры по сохранённой идее.";
    await createOwnedAiMessage(database, {
      ownerId: user.id,
      projectId,
      role: "user",
      content: generationPrompt
    });
    const instructions = createFirstGameInstructions({
      projectTitle: project.title,
      idea: project.description,
      style: project.style,
      language: project.language
    });
    let design: GameDesign;
    let usedStarter = false;

    try {
      const reply = await generateGameDesignerReply({ instructions, message: generationPrompt });
      design = parseGeneratedGameDesign(reply);
    } catch {
      try {
        const cloudflareReply = await generateCloudflareGameDesignerReply({
          instructions,
          message: generationPrompt
        });

        if (!cloudflareReply) {
          throw new Error("No structured game response was generated.");
        }

        design = parseGeneratedGameDesign(cloudflareReply);
      } catch {
        design = createEditableStarterGame({
          projectTitle: project.title,
          idea: project.description,
          language: project.language
        });
        usedStarter = true;
      }
    }
    await createOwnedGameVersion(database, { ownerId: user.id, projectId, content: design });
    await createOwnedAiMessage(database, {
      ownerId: user.id,
      projectId,
      role: "assistant",
      content: usedStarter
        ? "Бесплатный AI не успел подготовить полный ответ, поэтому создан редактируемый стартовый черновик."
        : "Первая версия игры создана. Конструктор автоматически начинает собирать визуалы в едином стиле."
    });
    revalidatePath(`/projects/${projectId}`);
    return { status: "success", usedStarter };
  } catch (error) {
    if (error instanceof AiProviderRequestError || error instanceof ImageProviderRequestError) {
      if (error.status === 401 || error.status === 403) {
        return { status: "error", notice: "aiKey" };
      }

      if (error.status === 429) {
        return { status: "error", notice: "aiLimit" };
      }

      if (error.status === 400 || error.status === 404) {
        return { status: "error", notice: "aiSetup" };
      }
    }

    return { status: "error", notice: "aiFailed" };
  }
}
