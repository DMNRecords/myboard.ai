import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getOwnedProject,
  listOwnedProjects
} from "@/modules/projects/data/supabase-project-repository";

export async function getOwnedProjects(ownerId: string) {
  return listOwnedProjects(await createSupabaseServerClient(), ownerId);
}

export async function getOwnedProjectById(ownerId: string, projectId: string) {
  return getOwnedProject(await createSupabaseServerClient(), { ownerId, projectId });
}
