import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listOwnedAiMessages } from "@/modules/ai/data/supabase-ai-message-repository";

export async function getAiMessages(ownerId: string, projectId: string) {
  return listOwnedAiMessages(await createSupabaseServerClient(), { ownerId, projectId });
}
