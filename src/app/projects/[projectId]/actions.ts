"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOwnedGameVersion } from "@/modules/game-design/data/supabase-game-version-repository";
import { createGameDesign, temirtauGameTemplate } from "@/modules/game-design/domain/game-design";

type GameDesignActionResult = { status: "success" } | { status: "error" };

function valueFromForm(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function saveVersion(
  projectId: string,
  content: Parameters<typeof createOwnedGameVersion>[1]["content"]
): Promise<GameDesignActionResult> {
  const user = await getCurrentUser();

  if (!user || !projectId) {
    return { status: "error" };
  }

  try {
    await createOwnedGameVersion(await createSupabaseServerClient(), {
      ownerId: user.id,
      projectId,
      content
    });
    revalidatePath(`/projects/${projectId}`);
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}

export async function createTemirtauTemplateAction(
  formData: FormData
): Promise<GameDesignActionResult> {
  return saveVersion(valueFromForm(formData, "projectId"), temirtauGameTemplate);
}

export async function saveGameDesignAction(formData: FormData): Promise<GameDesignActionResult> {
  const projectId = valueFromForm(formData, "projectId");

  try {
    return await saveVersion(
      projectId,
      createGameDesign({
        concept: valueFromForm(formData, "concept"),
        objective: valueFromForm(formData, "objective"),
        playerCount: valueFromForm(formData, "playerCount"),
        duration: valueFromForm(formData, "duration"),
        rules: valueFromForm(formData, "rules"),
        boardTitle: valueFromForm(formData, "boardTitle"),
        boardSpaces: valueFromForm(formData, "boardSpaces"),
        cards: valueFromForm(formData, "cards")
      })
    );
  } catch {
    return { status: "error" };
  }
}
