import { getCurrentUser } from "@/lib/auth/current-user";
import { getPdfExportEntitlementForProject } from "@/modules/exports/application/get-pdf-export-entitlement";
import { getOwnedProjectById } from "@/modules/projects/application/get-owned-projects";

export const dynamic = "force-dynamic";

/**
 * Deliberately protected before a PDF file is produced. Stage 5 replaces the
 * entitlement source while preserving this server boundary for paid downloads.
 */
export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "authenticationRequired" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const project = await getOwnedProjectById(user.id, projectId);

  if (!project) {
    return Response.json({ error: "notFound" }, { status: 404 });
  }

  const entitlement = await getPdfExportEntitlementForProject(user.id, projectId);

  if (!entitlement.canDownloadPdf) {
    return Response.json({ error: entitlement.reason }, { status: 402 });
  }

  return Response.json({ error: "notImplemented" }, { status: 501 });
}
