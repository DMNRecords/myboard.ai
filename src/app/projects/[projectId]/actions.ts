"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createOwnedGameVersion,
  getLatestOwnedGameVersion,
  getOwnedGameVersionById
} from "@/modules/game-design/data/supabase-game-version-repository";
import {
  createGameDesign,
  getGameMode,
  hasGameBoard,
  temirtauGameTemplate
} from "@/modules/game-design/domain/game-design";

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
    const user = await getCurrentUser();

    if (!user || !projectId) {
      return { status: "error" };
    }

    const database = await createSupabaseServerClient();
    const current = await getLatestOwnedGameVersion(database, {
      ownerId: user.id,
      projectId
    });

    if (!current) {
      return { status: "error" };
    }

    const hasBoard = hasGameBoard(current.content);
    return await saveVersion(
      projectId,
      createGameDesign({
        concept: valueFromForm(formData, "concept"),
        objective: valueFromForm(formData, "objective"),
        playerCount: valueFromForm(formData, "playerCount"),
        duration: valueFromForm(formData, "duration"),
        rules: valueFromForm(formData, "rules"),
        mode: getGameMode(current.content),
        boardTitle: hasBoard ? valueFromForm(formData, "boardTitle") : undefined,
        boardSpaces: hasBoard ? valueFromForm(formData, "boardSpaces") : undefined,
        cards: valueFromForm(formData, "cards"),
        assets: valueFromForm(formData, "assets"),
        decks: current.content.decks,
        economy: current.content.economy,
        roles: current.content.roles,
        scenario: current.content.scenario,
        resources: current.content.resources
      })
    );
  } catch {
    return { status: "error" };
  }
}

export async function restoreGameVersionAction(
  formData: FormData
): Promise<GameDesignActionResult> {
  const user = await getCurrentUser();
  const projectId = valueFromForm(formData, "projectId");
  const versionId = valueFromForm(formData, "versionId");

  if (!user || !projectId || !versionId) {
    return { status: "error" };
  }

  try {
    const database = await createSupabaseServerClient();
    const source = await getOwnedGameVersionById(database, {
      ownerId: user.id,
      projectId,
      versionId
    });

    if (!source) {
      return { status: "error" };
    }

    await createOwnedGameVersion(database, {
      ownerId: user.id,
      projectId,
      content: { ...source.content, assets: source.content.assets ?? [] }
    });
    revalidatePath(`/projects/${projectId}`);
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}
