import { maskContact, pickDisplayField } from "@/lib/customRequest/customRequestQueries";

type Row = Record<string, unknown>;

function numStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim()) return v;
  return "";
}

function budgetLine(row: Row): string {
  const min = numStr(row.budget_min);
  const max = numStr(row.budget_max);
  const b = numStr((row as { budget?: unknown }).budget);
  if (min && max) return `${min} ~ ${max}`;
  if (b) return b;
  for (const k of ["min_budget", "max_budget", "price_range"]) {
    if (row[k] != null) return numStr(row[k]);
  }
  return "—";
}

function contactLineMasked(row: Row): string {
  for (const k of ["phone", "email", "kakao", "kakao_id", "line", "contact", "external_contact"]) {
    const v = row[k];
    if (typeof v === "string" && v.trim().length > 1) {
      return `마스킹: ${maskContact(v)} (선정 전·플랫폼 외 전달 정책에 따라 비공개)`;
    }
  }
  return "— (선정 전 직접 연락처는 비공개)";
}

/** 공개 상세(선택 전 연락처·외부 식별자는 마스킹) */
export function mapPostRowToPublicDetail(row: Row) {
  return {
    title: pickDisplayField(row, ["title", "subject"]),
    category: pickDisplayField(row, ["category", "category_label", "category_id"]),
    subject: pickDisplayField(row, ["subject", "topic", "course"]),
    goal: pickDisplayField(row, ["goal", "subcategory", "objective"]),
    body: pickDisplayField(row, ["body", "content", "description", "text"]),
    deadline: pickDisplayField(row, ["deadline", "due_at", "due_date", "ends_at", "close_at"]),
    budgetLine: budgetLine(row),
    deliverableFormat: pickDisplayField(row, ["deliverable_format", "result_format", "deliverable_type", "output_format"]),
    contactMasked: contactLineMasked(row),
    status: pickDisplayField(row, ["status", "state", "stage"]),
  };
}

export function attachmentNote(row: Row): string {
  for (const k of ["attachment_urls", "files", "attachments", "file_count", "has_attachments"]) {
    const v = row[k];
    if (Array.isArray(v) && v.length) return `첨부 ${v.length}건(Storage 연동 후 미리보기)`;
    if (typeof v === "number" && v > 0) return `첨부·파일 ref ${v} (연동 예정)`;
    if (v === true) return "첨부 있음(연동 예정)";
  }
  return "첨부 자리(Storage + RLS 후)"; // 정책: 더미 링크 없이 설명만
}
