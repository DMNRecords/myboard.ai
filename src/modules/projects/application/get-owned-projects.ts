import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listOwnedProjects } from "@/modules/projects/data/supabase-project-repository";

export async function getOwnedProjects(ownerId: string) {
  return listOwnedProjects(await createSupabaseServerClient(), ownerId);
}
