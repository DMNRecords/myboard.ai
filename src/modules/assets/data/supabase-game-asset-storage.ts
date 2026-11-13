import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { GameVisualKind } from "@/modules/assets/domain/game-visual";
import type { GameAsset } from "@/modules/game-design/domain/game-design";

type DatabaseClient = SupabaseClient<Database>;

export async function uploadGeneratedGameVisual(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string; kind: GameVisualKind; image: Uint8Array }
): Promise<GameAsset> {
  const fileName = `${input.kind}-${crypto.randomUUID()}.png`;
  const path = `${input.ownerId}/${input.projectId}/${fileName}`;
  const { error } = await database.storage.from("game-assets").upload(path, input.image, {
    contentType: "image/png",
    upsert: false
  });

  if (error) {
    throw new Error("Unable to store generated game visual.");
  }

  const { data } = database.storage.from("game-assets").getPublicUrl(path);

  return {
    id: crypto.randomUUID(),
    title: `AI: ${input.kind}`,
    url: data.publicUrl,
    description: `Сгенерированный визуал: ${input.kind}`
  };
}
