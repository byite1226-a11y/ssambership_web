import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { pickStoragePathFromDeliverableRow } from "@/lib/customRequest/orderDeliverableFiles";
import { formatOrderRoomDateTime } from "@/lib/customRequest/orderLifecycleConstants";

type Row = Record<string, unknown>;

export function formatDeliverableFileSize(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pickDeliverableFileName(row: Row): string {
  const name = pickDisplayField(row, ["original_filename", "file_name", "filename", "original_name"]);
  return name !== "—" ? name : "작업 파일";
}

export function pickDeliverableSize(row: Row): number | null {
  for (const k of ["file_size", "file_size_bytes", "size_bytes", "size"] as const) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

export function pickDeliverableSubmittedAt(row: Row): string {
  for (const k of ["submitted_at", "created_at", "updated_at"] as const) {
    const v = row[k];
    if (v != null) return formatOrderRoomDateTime(v);
  }
  return "—";
}

export function isDeliverableDownloadable(row: Row): boolean {
  const path = pickStoragePathFromDeliverableRow(row);
  return Boolean(path && path.length > 0 && !path.startsWith("http://") && !path.startsWith("https://"));
}

export function mapDeliverableItem(row: Row, index: number) {
  const id = typeof row.id === "string" ? row.id : String(index);
  const version = typeof row.version === "number" ? row.version : index + 1;
  return {
    id,
    version,
    fileName: pickDeliverableFileName(row),
    sizeLabel: formatDeliverableFileSize(pickDeliverableSize(row)),
    submittedAtLabel: pickDeliverableSubmittedAt(row),
    downloadable: isDeliverableDownloadable(row),
    isLatest: index === 0,
  };
}

export function pickRevisionNote(row: Row): string {
  for (const k of ["request_note", "note", "body", "message", "content"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "수정 요청 내용이 없습니다.";
}

export function pickMessageBody(row: Row): string {
  for (const k of ["body", "message", "content", "text"] as const) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function isStudentMessage(row: Row, studentId: string): boolean {
  for (const k of ["author_id", "user_id", "sender_id"] as const) {
    const v = row[k];
    if (typeof v === "string" && v === studentId) return true;
  }
  for (const k of ["sender_role", "role", "actor_role", "party"] as const) {
    const v = String(row[k] ?? "").toLowerCase();
    if (v === "student") return true;
  }
  return false;
}

export function computeRevisionUsage(deliverableCount: number, max = 2): {
  used: number;
  max: number;
  exceeded: boolean;
} {
  const used = Math.max(0, deliverableCount - 1);
  return { used, max, exceeded: used >= max };
}

export function reviewDeadlineIsoFromSubmitted(submittedRaw: unknown): string | null {
  const d = parseDateLike(submittedRaw);
  if (!d) return null;
  d.setDate(d.getDate() + 3);
  return d.toISOString();
}

export function pickLatestRevisionRequest(
  revisionRows: Row[],
  messageRows: Row[],
  studentId: string
): { message: string; requestedAtLabel: string } {
  type Cand = { message: string; atMs: number; atRaw: unknown };
  const candidates: Cand[] = [];

  for (const r of revisionRows) {
    const note = pickRevisionNote(r);
    const atRaw = pickCreatedAtRaw(r);
    const ms = parseDateLike(atRaw)?.getTime() ?? 0;
    candidates.push({ message: note, atMs: ms, atRaw });
  }

  for (const r of messageRows) {
    if (!isStudentMessage(r, studentId)) continue;
    const body = pickMessageBody(r);
    if (!body) continue;
    const atRaw = pickCreatedAtRaw(r);
    const ms = parseDateLike(atRaw)?.getTime() ?? 0;
    candidates.push({ message: body, atMs: ms, atRaw });
  }

  if (candidates.length === 0) {
    return { message: "수정 요청 내용이 없습니다.", requestedAtLabel: "—" };
  }

  candidates.sort((a, b) => b.atMs - a.atMs);
  const best = candidates[0];
  if (!best) {
    return { message: "수정 요청 내용이 없습니다.", requestedAtLabel: "—" };
  }
  return {
    message: best.message,
    requestedAtLabel: best.atRaw != null ? formatOrderRoomDateTime(best.atRaw) : "—",
  };
}

export function studentDisplayInitial(name: string): string {
  const t = name.trim();
  return t ? t.slice(0, 1) : "학";
}

function pickCreatedAtRaw(row: Row): unknown {
  for (const k of ["created_at", "updated_at", "submitted_at"] as const) {
    const v = row[k];
    if (v != null) return v;
  }
  return null;
}

function parseDateLike(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function pickSubmittedRaw(row: Row | null): unknown {
  if (!row) return null;
  for (const k of ["submitted_at", "created_at", "updated_at"] as const) {
    const v = row[k];
    if (v != null && String(v).trim()) return v;
  }
  return null;
}

export function pickOrderAmountLabel(order: Row | null, fallback = "—"): string {
  if (!order) return fallback;
  for (const k of ["agreed_price", "proposed_price", "price", "amount", "total_amount"] as const) {
    const v = order[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      return `${v.toLocaleString("ko-KR")}캐시`;
    }
  }
  return fallback;
}
