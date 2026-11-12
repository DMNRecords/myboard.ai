import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnedPdfExportEntitlement } from "@/modules/exports/data/supabase-export-entitlement-repository";

export async function getPdfExportEntitlementForProject(ownerId: string, projectId: string) {
  return getOwnedPdfExportEntitlement(await createSupabaseServerClient(), { ownerId, projectId });
}
