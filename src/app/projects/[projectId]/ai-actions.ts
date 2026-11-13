"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAiProviderConfig, hasImageProviderConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ImageProviderRequestError,
  generateGameVisual
} from "@/modules/assets/data/openai-image-provider";
import { uploadGeneratedGameVisual } from "@/modules/assets/data/supabase-game-asset-storage";
import {
  buildGameVisualPrompt,
  dailyImageLimit,
  getInitialGameVisualKinds
} from "@/modules/assets/domain/game-visual";
import {
  createGameDesignerInstructions,
  normalizeChatPrompt,
  reviewChatPrompt
} from "@/modules/ai/domain/chat";
import {
  countOwnedAiPromptsSince,
  countOwnedImagePromptsSince,
  createModerationEvent,
  createOwnedAiMessage
} from "@/modules/ai/data/supabase-ai-message-repository";
import {
  AiProviderRequestError,
  generateGameDesignerReply
} from "@/modules/ai/data/openai-responses-provider";
import {
  createFirstGameInstructions,
  parseGeneratedGameDesign
} from "@/modules/ai/domain/game-generation";
import { createOwnedGameVersion } from "@/modules/game-design/data/supabase-game-version-repository";
import { getLatestOwnedGameVersion } from "@/modules/game-design/data/supabase-game-version-repository";
import type { GameDesign } from "@/modules/game-design/domain/game-design";
import { getOwnedProject } from "@/modules/projects/data/supabase-project-repository";
import type { GameProject } from "@/modules/projects/domain/project";

export type AiActionResult =
  | { status: "success" }
  | {
      status: "error";
      notice: "aiFailed" | "aiKey" | "aiLimit" | "aiQuota" | "aiSetup" | "aiModerated";
    };

const dailyPromptLimit = 8;

function startOfCurrentDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

async function createInitialVisualSet(input: {
  database: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  ownerId: string;
  project: GameProject;
  design: GameDesign;
}): Promise<number> {
  if (!hasImageProviderConfig()) {
    return 0;
  }

  const usedToday = await countOwnedImagePromptsSince(input.database, {
    ownerId: input.ownerId,
    since: startOfCurrentDay()
  });
  const kinds = getInitialGameVisualKinds({
    idea: input.project.description ?? input.project.title,
    design: input.design
  }).slice(0, Math.max(0, dailyImageLimit - usedToday));

  if (kinds.length === 0) {
    return 0;
  }

  await Promise.all(
    kinds.map((kind) =>
      createOwnedAiMessage(input.database, {
        ownerId: input.ownerId,
        projectId: input.project.id,
        role: "user",
        content: `Создать AI-визуал: ${kind}.`
      })
    )
  );
  const results = await Promise.allSettled(
    kinds.map(async (kind) => {
      const image = await generateGameVisual(
        buildGameVisualPrompt({
          kind,
          projectTitle: input.project.title,
          projectIdea: input.project.description,
          style: input.project.style,
          design: input.design
        })
      );
      return uploadGeneratedGameVisual(input.database, {
        ownerId: input.ownerId,
        projectId: input.project.id,
        kind,
        image
      });
    })
  );
  const assets = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  if (assets.length) {
    await createOwnedGameVersion(input.database, {
      ownerId: input.ownerId,
      projectId: input.project.id,
      content: { ...input.design, assets: [...(input.design.assets ?? []), ...assets] }
    });
  }

  return assets.length;
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
    const reply = await generateGameDesignerReply({
      instructions: createFirstGameInstructions({
        projectTitle: project.title,
        idea: project.description,
        style: project.style,
        language: project.language
      }),
      message: generationPrompt
    });
    const design = parseGeneratedGameDesign(reply);
    await createOwnedGameVersion(database, { ownerId: user.id, projectId, content: design });
    const visualCount = await createInitialVisualSet({
      database,
      ownerId: user.id,
      project,
      design
    });
    await createOwnedAiMessage(database, {
      ownerId: user.id,
      projectId,
      role: "assistant",
      content:
        visualCount > 0
          ? `Первая версия игры создана. AI подготовил ${visualCount} визуальных компонентов в едином стиле.`
          : "Первая версия игры создана: правила, поле и карточки уже доступны в конструкторе."
    });
    revalidatePath(`/projects/${projectId}`);
    return { status: "success" };
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
