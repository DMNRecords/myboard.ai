import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { GameDesign } from "@/modules/game-design/domain/game-design";

type GameVersionRow = Database["public"]["Tables"]["game_versions"]["Row"];
type DatabaseClient = SupabaseClient<Database>;

export type GameVersion = {
  id: string;
  projectId: string;
  ownerId: string;
  version: number;
  content: GameDesign;
  createdAt: Date;
};

function mapGameVersion(row: GameVersionRow): GameVersion {
  return {
    id: row.id,
    projectId: row.project_id,
    ownerId: row.owner_id,
    version: row.version,
    content: row.content as GameDesign,
    createdAt: new Date(row.created_at)
  };
}

export async function getLatestOwnedGameVersion(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string }
): Promise<GameVersion | null> {
  const { data, error } = await database
    .from("game_versions")
    .select("id, project_id, owner_id, version, content, created_at")
    .eq("owner_id", input.ownerId)
    .eq("project_id", input.projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load game version.");
  }

  return data ? mapGameVersion(data) : null;
}

export async function createOwnedGameVersion(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string; content: GameDesign }
): Promise<GameVersion> {
  const latest = await getLatestOwnedGameVersion(database, input);
  const { data, error } = await database
    .from("game_versions")
    .insert({
      owner_id: input.ownerId,
      project_id: input.projectId,
      version: (latest?.version ?? 0) + 1,
      content: input.content
    })
    .select("id, project_id, owner_id, version, content, created_at")
    .single();

  if (error || !data) {
    throw new Error("Unable to save game version.");
  }

  return mapGameVersion(data);
}
