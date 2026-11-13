"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getImageProviderConfigIssue } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ImageProviderRequestError,
  generateGameVisual
} from "@/modules/assets/data/openai-image-provider";
import { uploadGeneratedGameVisual } from "@/modules/assets/data/supabase-game-asset-storage";
import {
  buildGameVisualPrompt,
  dailyImageLimit,
  isGameVisualKind
} from "@/modules/assets/domain/game-visual";
import {
  countOwnedImagePromptsSince,
  createModerationEvent,
  createOwnedAiMessage
} from "@/modules/ai/data/supabase-ai-message-repository";
import { reviewChatPrompt } from "@/modules/ai/domain/chat";
import {
  createOwnedGameVersion,
  getLatestOwnedGameVersion
} from "@/modules/game-design/data/supabase-game-version-repository";
import { getOwnedProject } from "@/modules/projects/data/supabase-project-repository";

export type ImageActionResult =
  | { status: "success" }
  | {
      status: "error";
      notice:
        | "imageFailed"
        | "imageKey"
        | "imageLimit"
        | "imageQuota"
        | "imageSetup"
        | "imageSetupAccount"
        | "imageSetupKey"
        | "imageSetupModel"
        | "imageSetupProvider"
        | "imageModerated";
    };

function startOfCurrentDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function generateGameVisualAction(formData: FormData): Promise<ImageActionResult> {
  const user = await getCurrentUser();
  const projectId = getFormValue(formData, "projectId");
  const kind = getFormValue(formData, "kind");

  if (!user || !projectId || !isGameVisualKind(kind)) {
    return { status: "error", notice: "imageFailed" };
  }

  const imageConfigIssue = getImageProviderConfigIssue();

  if (imageConfigIssue) {
    const noticeByIssue = {
      account: "imageSetupAccount",
      key: "imageSetupKey",
      model: "imageSetupModel",
      provider: "imageSetupProvider"
    } as const;

    return { status: "error", notice: noticeByIssue[imageConfigIssue] };
  }

  try {
    const database = await createSupabaseServerClient();
    const [project, version] = await Promise.all([
      getOwnedProject(database, { ownerId: user.id, projectId }),
      getLatestOwnedGameVersion(database, { ownerId: user.id, projectId })
    ]);

    if (!project || !version) {
      return { status: "error", notice: "imageFailed" };
    }

    const review = reviewChatPrompt(project.description ?? project.title);

    if (!review.allowed) {
      await createModerationEvent(database, { ownerId: user.id, projectId, reason: review.reason });
      return { status: "error", notice: "imageModerated" };
    }

    const promptCount = await countOwnedImagePromptsSince(database, {
      ownerId: user.id,
      since: startOfCurrentDay()
    });

    if (promptCount >= dailyImageLimit) {
      return { status: "error", notice: "imageQuota" };
    }

    const requestLabel = `Создать AI-визуал: ${kind}.`;
    await createOwnedAiMessage(database, {
      ownerId: user.id,
      projectId,
      role: "user",
      content: requestLabel
    });
    const image = await generateGameVisual(
      buildGameVisualPrompt({
        kind,
        projectTitle: project.title,
        projectIdea: project.description,
        style: project.style,
        design: version.content
      })
    );
    const asset = await uploadGeneratedGameVisual(database, {
      ownerId: user.id,
      projectId,
      kind,
      image
    });
    await createOwnedGameVersion(database, {
      ownerId: user.id,
      projectId,
      content: { ...version.content, assets: [...(version.content.assets ?? []), asset] }
    });
    await createOwnedAiMessage(database, {
      ownerId: user.id,
      projectId,
      role: "assistant",
      content: `AI создал визуал «${asset.title}» и добавил его в новую версию игры.`
    });
    revalidatePath(`/projects/${projectId}`);
    return { status: "success" };
  } catch (error) {
    if (error instanceof ImageProviderRequestError) {
      if (error.status === 401 || error.status === 403) {
        return { status: "error", notice: "imageKey" };
      }

      if (error.status === 429) {
        return { status: "error", notice: "imageLimit" };
      }
    }

    return { status: "error", notice: "imageFailed" };
  }
}
