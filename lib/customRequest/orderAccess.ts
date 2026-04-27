import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

/**
 * custom_request_orders(후보) 한 행에 대해 student | mentor 권한
 * 스키마에 맞는 FK 컬럼이 있으면 일치로 통과
 */
export function canAccessOrder(row: Row | null, userId: string, role: AppRole): { ok: boolean; detail: string } {
  if (!row) return { ok: false, detail: "주문 없음" };
  if (role === "student" || role === "admin") {
    for (const k of ["student_id", "buyer_id", "user_id", "client_id", "author_id", "requester_id"]) {
      if (k in row && String(row[k]) === userId) {
        return { ok: true, detail: k };
      }
    }
  }
  if (role === "mentor" || role === "admin") {
    for (const k of ["mentor_id", "mentor_user_id", "assignee_id", "assigned_mentor_id", "selected_mentor_id", "expert_id"]) {
      if (k in row && String(row[k]) === userId) {
        return { ok: true, detail: k };
      }
    }
  }
  if (role === "admin") {
    return { ok: true, detail: "admin" };
  }
  return { ok: false, detail: "order와 사용자 매핑 실패" };
}
