import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  type GameProject,
  type ProjectLanguage,
  type ProjectStatus,
  isProjectLanguage
} from "@/modules/projects/domain/project";

type GameProjectRow = Database["public"]["Tables"]["game_projects"]["Row"];
type DatabaseClient = SupabaseClient<Database>;

const projectColumns =
  "id, owner_id, title, description, language, style, status, version, created_at, updated_at, archived_at";

function mapGameProject(row: GameProjectRow): GameProject {
  if (!isProjectLanguage(row.language)) {
    throw new Error("Game project has an unsupported language.");
  }

  if (row.status !== "draft" && row.status !== "archived") {
    throw new Error("Game project has an unsupported status.");
  }

  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    language: row.language,
    style: row.style,
    status: row.status as ProjectStatus,
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    archivedAt: row.archived_at ? new Date(row.archived_at) : null
  };
}

function throwOnDatabaseError(error: { message: string } | null, operation: string): void {
  if (error) {
    throw new Error(`Unable to ${operation} game project.`);
  }
}

export async function listOwnedProjects(
  database: DatabaseClient,
  ownerId: string
): Promise<GameProject[]> {
  const { data, error } = await database
    .from("game_projects")
    .select(projectColumns)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  throwOnDatabaseError(error, "list");

  return (data ?? []).map(mapGameProject);
}

export async function getOwnedProject(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string }
): Promise<GameProject | null> {
  const { data, error } = await database
    .from("game_projects")
    .select(projectColumns)
    .eq("owner_id", input.ownerId)
    .eq("id", input.projectId)
    .maybeSingle();

  throwOnDatabaseError(error, "load");

  return data ? mapGameProject(data) : null;
}

export async function createOwnedProject(
  database: DatabaseClient,
  input: { ownerId: string; title: string; language: ProjectLanguage }
): Promise<GameProject> {
  const { data, error } = await database
    .from("game_projects")
    .insert({ owner_id: input.ownerId, title: input.title, language: input.language })
    .select(projectColumns)
    .single();

  throwOnDatabaseError(error, "create");

  if (!data) {
    throw new Error("Unable to create game project.");
  }

  return mapGameProject(data);
}

export async function renameOwnedProject(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string; title: string }
): Promise<GameProject | null> {
  const { data, error } = await database
    .from("game_projects")
    .update({ title: input.title })
    .eq("id", input.projectId)
    .eq("owner_id", input.ownerId)
    .select(projectColumns)
    .maybeSingle();

  throwOnDatabaseError(error, "rename");

  return data ? mapGameProject(data) : null;
}

export async function archiveOwnedProject(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string; archivedAt: Date }
): Promise<GameProject | null> {
  const { data, error } = await database
    .from("game_projects")
    .update({ archived_at: input.archivedAt.toISOString(), status: "archived" })
    .eq("id", input.projectId)
    .eq("owner_id", input.ownerId)
    .eq("status", "draft")
    .select(projectColumns)
    .maybeSingle();

  throwOnDatabaseError(error, "archive");

  return data ? mapGameProject(data) : null;
}

export async function deleteOwnedProject(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string }
): Promise<boolean> {
  const { data, error } = await database
    .from("game_projects")
    .delete()
    .eq("id", input.projectId)
    .eq("owner_id", input.ownerId)
    .select("id")
    .maybeSingle();

  throwOnDatabaseError(error, "delete");

  return data !== null;
}
