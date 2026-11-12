import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLatestOwnedGameVersion } from "@/modules/game-design/data/supabase-game-version-repository";

export async function getLatestGameVersion(ownerId: string, projectId: string) {
  return getLatestOwnedGameVersion(await createSupabaseServerClient(), { ownerId, projectId });
}
