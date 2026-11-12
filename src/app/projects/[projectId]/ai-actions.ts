"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAiProviderConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  generateGameDesignerReply
} from "@/modules/ai/data/openai-responses-provider";
import { getOwnedProject } from "@/modules/projects/data/supabase-project-repository";

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
