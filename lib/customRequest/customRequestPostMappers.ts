import { maskContact, pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  formatBudgetRangeKrw,
  formatDateYYYYMMDD,
  mentorPostStatusLabelForUi,
  mentorPostStatusToken,
} from "@/lib/customRequest/mentorCustomRequestDisplay";

type Row = Record<string, unknown>;

/** 의뢰 진행단계 스텝퍼 active 값 — `CustomRequestLifecycleStepper`와 동일 */
export type CustomRequestLifecycleStep = "register" | "compare" | "select" | "progress" | "complete";

/** post status/state → lifecycle stepper active (모집 중=compare, 종료=complete, 기본 compare) */
export function lifecycleStepFromPostRow(row: Row): CustomRequestLifecycleStep {
  const t = mentorPostStatusToken(row);
  if (!t) return "compare";
  if (
    t.includes("complete") ||
    t.includes("fulfill") ||
    t === "closed" ||
    t === "archived" ||
    t.includes("cancel") ||
    t === "canceled" ||
    t === "cancelled"
  ) {
    return "complete";
  }
  if (t === "selected" || t === "in_progress" || t.includes("progress")) {
    return "progress";
  }
  return "compare";
}

function pickDeadlineRaw(row: Row): unknown {
  for (const k of ["deadline", "due_at", "due_date", "ends_at", "close_at"] as const) {
    if (row[k] != null) {
      return row[k];
    }
  }
  return null;
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
/**
 * browse RPC(006·018)와 맞춰 모집 중인 의뢰만 지원 가능으로 본다.
 * status·state가 비어 있으면(스키마상 정보 없음) 열어 두어 기존 공개 상세와 톤을 맞춤.
 */
export function isDraftCustomRequestPost(row: Row | null | undefined): boolean {
  if (!row) return false;
  const s = String(row.status ?? "").trim().toLowerCase();
  const st = String(row.state ?? "").trim().toLowerCase();
  const ps = String(row.post_status ?? "").trim().toLowerCase();
  return s === "draft" || st === "draft" || ps === "draft";
}

export function isMentorApplicablePostStatus(row: Row): boolean {
  const s = String(row.status ?? "").trim().toLowerCase();
  const st = String((row as { state?: string }).state ?? "").trim().toLowerCase();
  if (s.includes("close") || s.includes("취소") || s.includes("cancel") || s.includes("fulfill") || s === "archived" || s === "draft") {
    return false;
  }
  if (s === "open" || st === "open" || st === "published") {
    return true;
  }
  if (s.length === 0 && st.length === 0) {
    return true;
  }
  return false;
}

export function mapPostRowToPublicDetail(row: Row) {
  const statusToken = mentorPostStatusToken(row);
  return {
    title: pickDisplayField(row, ["title", "subject"]),
    category: pickDisplayField(row, ["category", "category_label", "category_id"]),
    subject: pickDisplayField(row, ["subject", "topic", "course"]),
    goal: pickDisplayField(row, ["goal", "subcategory", "objective"]),
    body: pickDisplayField(row, ["body"]),
    /** 표시용 `YYYY.MM.DD` 또는 `일정 협의` */
    deadline: formatDateYYYYMMDD(pickDeadlineRaw(row)),
    /** 천단위 + 원 / `금액 협의` */
    budgetLine: formatBudgetRangeKrw(row),
    deliverableFormat: pickDisplayField(row, ["deliverable_format", "result_format", "deliverable_type", "output_format"]),
    contactMasked: contactLineMasked(row),
    /** 사용자용 의뢰 상태 문구(배지는 `MentorPostStatusBadge` + row) */
    status: mentorPostStatusLabelForUi(statusToken),
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
