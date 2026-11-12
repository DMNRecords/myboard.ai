import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  type ExportEntitlement,
  getPdfExportEntitlement,
  type PdfExportGrant
} from "@/modules/exports/domain/export-entitlement";

type DatabaseClient = SupabaseClient<Database>;

function isGrantStatus(value: string): value is PdfExportGrant["status"] {
  return value === "active" || value === "revoked";
}

export async function getOwnedPdfExportEntitlement(
  database: DatabaseClient,
  input: { ownerId: string; projectId: string }
): Promise<ExportEntitlement> {
  const { data, error } = await database
    .from("project_entitlements")
    .select("status, starts_at, expires_at")
    .eq("owner_id", input.ownerId)
    .eq("project_id", input.projectId)
    .eq("capability", "pdf_export");

  if (error) {
    throw new Error("Unable to load export entitlement.");
  }

  const grants: PdfExportGrant[] = (data ?? []).flatMap((row) =>
    isGrantStatus(row.status)
      ? [
          {
            status: row.status,
            startsAt: new Date(row.starts_at),
            expiresAt: row.expires_at ? new Date(row.expires_at) : null
          }
        ]
      : []
  );

  return getPdfExportEntitlement(grants);
}
