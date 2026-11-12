import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getLatestOwnedGameVersion,
  listOwnedGameVersions
} from "@/modules/game-design/data/supabase-game-version-repository";

export async function getLatestGameVersion(ownerId: string, projectId: string) {
  return getLatestOwnedGameVersion(await createSupabaseServerClient(), { ownerId, projectId });
}

export async function getGameVersions(ownerId: string, projectId: string) {
  return listOwnedGameVersions(await createSupabaseServerClient(), { ownerId, projectId });
}
