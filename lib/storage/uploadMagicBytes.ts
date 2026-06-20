export type JpgPngPdfKind = "jpg" | "png" | "pdf";
export type JpgPngPdfMimeType = "image/jpeg" | "image/png" | "application/pdf";

export type VerifiedJpgPngPdfFile = {
  kind: JpgPngPdfKind;
  extension: JpgPngPdfKind;
  mimeType: JpgPngPdfMimeType;
};

export const JPG_PNG_PDF_EXTENSION_ERROR = "JPG, JPEG, PNG, PDF 형식의 파일만 업로드할 수 있습니다.";
export const JPG_PNG_PDF_MAGIC_ERROR = "파일 내용이 허용된 형식과 일치하지 않습니다.";

const JPEG_MAGIC = [0xff, 0xd8, 0xff] as const;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46] as const;
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50] as const;
const GIF_87A_MAGIC = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] as const;
const GIF_89A_MAGIC = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] as const;
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04] as const;
const ZIP_EMPTY_MAGIC = [0x50, 0x4b, 0x05, 0x06] as const;
const ZIP_SPANNED_MAGIC = [0x50, 0x4b, 0x07, 0x08] as const;
const FTYPE_MAGIC = [0x66, 0x74, 0x79, 0x70] as const;
const EBML_MAGIC = [0x1a, 0x45, 0xdf, 0xa3] as const;

function asBytes(buffer: ArrayBuffer | Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

function isWebp(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && startsWith(bytes, RIFF_MAGIC) && startsWith(bytes.slice(8), WEBP_MAGIC);
}

function isZip(bytes: Uint8Array): boolean {
  return startsWith(bytes, ZIP_MAGIC) || startsWith(bytes, ZIP_EMPTY_MAGIC) || startsWith(bytes, ZIP_SPANNED_MAGIC);
}

function isIsoBaseMedia(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && startsWith(bytes.slice(4), FTYPE_MAGIC);
}

export function normalizeJpgPngPdfExtension(value: string | null | undefined): JpgPngPdfKind | null {
  const ext = (value ?? "").trim().toLowerCase().replace(/^\./, "");
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png" || ext === "pdf") return ext;
  return null;
}

export function detectJpgPngPdfMagic(buffer: ArrayBuffer | Uint8Array): VerifiedJpgPngPdfFile | null {
  const bytes = asBytes(buffer);

  if (startsWith(bytes, JPEG_MAGIC)) {
    return { kind: "jpg", extension: "jpg", mimeType: "image/jpeg" };
  }
  if (startsWith(bytes, PNG_MAGIC)) {
    return { kind: "png", extension: "png", mimeType: "image/png" };
  }
  if (startsWith(bytes, PDF_MAGIC)) {
    return { kind: "pdf", extension: "pdf", mimeType: "application/pdf" };
  }

  return null;
}

export function validateJpgPngPdfMagicBytes(
  buffer: ArrayBuffer | Uint8Array,
  expectedExtension?: string | null
): { ok: true; file: VerifiedJpgPngPdfFile } | { ok: false; error: string } {
  const expected = expectedExtension == null ? null : normalizeJpgPngPdfExtension(expectedExtension);
  if (expectedExtension != null && !expected) {
    return { ok: false, error: JPG_PNG_PDF_EXTENSION_ERROR };
  }

  const detected = detectJpgPngPdfMagic(buffer);
  if (!detected) {
    return { ok: false, error: JPG_PNG_PDF_MAGIC_ERROR };
  }

  if (expected && detected.kind !== expected) {
    return { ok: false, error: JPG_PNG_PDF_MAGIC_ERROR };
  }

  return { ok: true, file: detected };
}

export function validateMagicBytesForMime(buffer: ArrayBuffer | Uint8Array, mime: string): string | null {
  const bytes = asBytes(buffer);
  const normalized = mime.trim().toLowerCase();

  if (normalized === "image/jpeg") {
    return startsWith(bytes, JPEG_MAGIC) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }
  if (normalized === "image/png") {
    return startsWith(bytes, PNG_MAGIC) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }
  if (normalized === "application/pdf") {
    return startsWith(bytes, PDF_MAGIC) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }
  if (normalized === "image/webp") {
    return isWebp(bytes) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }
  if (normalized === "image/gif") {
    return startsWith(bytes, GIF_87A_MAGIC) || startsWith(bytes, GIF_89A_MAGIC) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }
  if (
    normalized === "application/zip" ||
    normalized === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalized === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return isZip(bytes) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }
  if (normalized === "video/mp4" || normalized === "video/quicktime") {
    return isIsoBaseMedia(bytes) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }
  if (normalized === "video/webm") {
    return startsWith(bytes, EBML_MAGIC) ? null : JPG_PNG_PDF_MAGIC_ERROR;
  }

  return "지원하지 않는 파일 형식입니다.";
}
