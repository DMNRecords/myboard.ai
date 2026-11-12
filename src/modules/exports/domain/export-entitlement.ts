export type ExportEntitlement = {
  canDownloadPdf: boolean;
  reason?: "paymentRequired";
};

/**
 * Centralizes the server-side export decision. Stage 5 will replace this
 * beta-safe default with a Purchase/Entitlement lookup.
 */
export function getPdfExportEntitlement(): ExportEntitlement {
  return { canDownloadPdf: false, reason: "paymentRequired" };
}
