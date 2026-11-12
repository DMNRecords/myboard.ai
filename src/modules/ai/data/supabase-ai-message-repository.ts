import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { AiChatRole } from "@/modules/ai/domain/chat";

type DatabaseClient = SupabaseClient<Database>;
type MessageRow = Database["public"]["Tables"]["game_ai_messages"]["Row"];
type MessageSelection = Pick<MessageRow, "id" | "role" | "content" | "created_at">;

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: Date;
};

function mapMessage(row: MessageSelection): AiChatMessage {
  if (row.role !== "user" && row.role !== "assistant") {
    throw new Error("AI message has an unsupported role.");
  }

  return { id: row.id, role: row.role, content: row.content, createdAt: new Date(row.created_at) };
}

export async function listOwnedAiMessages(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string }
): Promise<AiChatMessage[]> {
  const { data, error } = await database
    .from("game_ai_messages")
    .select("id, role, content, created_at")
    .eq("owner_id", input.ownerId)
    .eq("project_id", input.projectId)
    .order("created_at", { ascending: true })
    .limit(40);

  if (error) {
    throw new Error("Unable to list AI messages.");
  }

  return (data ?? []).map(mapMessage);
}

export async function createOwnedAiMessage(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string; role: AiChatRole; content: string }
): Promise<AiChatMessage> {
  const { data, error } = await database
    .from("game_ai_messages")
    .insert({
      owner_id: input.ownerId,
      project_id: input.projectId,
      role: input.role,
      content: input.content
    })
    .select("id, role, content, created_at")
    .single();

  if (error || !data) {
    throw new Error("Unable to save AI message.");
  }

  return mapMessage(data);
}

export async function countOwnedAiPromptsSince(
  database: DatabaseClient,
  input: { ownerId: string; since: Date }
): Promise<number> {
  const { count, error } = await database
    .from("game_ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", input.ownerId)
    .eq("role", "user")
    .gte("created_at", input.since.toISOString());

  if (error) {
    throw new Error("Unable to count AI prompts.");
  }

  return count ?? 0;
}

export async function createModerationEvent(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string; reason: string }
): Promise<void> {
  const { error } = await database.from("game_moderation_events").insert({
    owner_id: input.ownerId,
    project_id: input.projectId,
    reason: input.reason
  });

  if (error) {
    throw new Error("Unable to record moderation event.");
  }
}
