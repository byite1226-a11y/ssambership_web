const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

export function normalizeAttachmentMime(mimeType: string | null | undefined, filename: string): string {
  const m = (mimeType ?? "").trim().toLowerCase();
  if (m) return m;
  const ext = filename.includes(".") ? (filename.split(".").pop()?.trim().toLowerCase() ?? "") : "";
  return EXT_TO_MIME[ext] ?? "";
}

export function isPreviewableImageMime(mimeType: string | null | undefined, filename: string): boolean {
  return IMAGE_MIMES.has(normalizeAttachmentMime(mimeType, filename));
}

export function isPreviewablePdfMime(mimeType: string | null | undefined, filename: string): boolean {
  return normalizeAttachmentMime(mimeType, filename) === "application/pdf";
}

export function fileExtensionLabel(filename: string, mimeType?: string | null): string {
  const ext = filename.includes(".") ? filename.split(".").pop()?.trim() : "";
  if (ext && ext.length > 0) return ext.slice(0, 4).toUpperCase();
  const mime = normalizeAttachmentMime(mimeType ?? null, filename);
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "JPG";
  if (mime.includes("png")) return "PNG";
  if (mime.includes("webp")) return "WEBP";
  if (mime.includes("word")) return "DOCX";
  if (mime.includes("presentation")) return "PPTX";
  if (mime.includes("zip")) return "ZIP";
  return "FILE";
}
