export type ExportEntitlement = {
  canDownloadPdf: boolean;
  reason?: "paymentRequired";
};

export type PdfExportGrant = {
  expiresAt: Date | null;
  startsAt: Date;
  status: "active" | "revoked";
};

export function getPdfExportEntitlement(
  grants: PdfExportGrant[],
  now = new Date()
): ExportEntitlement {
  const canDownloadPdf = grants.some(
    (grant) =>
      grant.status === "active" &&
      grant.startsAt <= now &&
      (grant.expiresAt === null || grant.expiresAt > now)
  );

  return canDownloadPdf ? { canDownloadPdf } : { canDownloadPdf: false, reason: "paymentRequired" };
}
