import type { SupabaseClient } from "@supabase/supabase-js";
import { getMentorUserPublic, loadMentorProfilesForDirectory } from "@/lib/auth/mentorPublicRead";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import {
  formatOrderRoomDate,
  normalizedPrimaryOrderStatus,
  orderStatusLabelForUi,
  paymentStatusLabelForUi,
} from "@/lib/customRequest/orderLifecycleConstants";
import { pickMentorIdFromOrderRow } from "@/lib/customRequest/orderDetailQueries";
import { buildMentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import { mentorCustomOrderWorkroomHref } from "@/lib/home/mentorDashboardQueries";
import { shortOrderIdForDisplay } from "@/lib/utils/formatOrderIdForDisplay";

type Row = Record<string, unknown>;

/** `orderAccess.canAccessOrder` 학생 분기와 동일 순서 */
export const STUDENT_ORDER_OWNER_FK_CANDIDATES = [
  "student_id",
  "buyer_id",
  "user_id",
  "client_id",
  "author_id",
  "requester_id",
] as const;

const CUSTOM_REQUEST_ORDERS_TABLE = "custom_request_orders" as const;

async function listExistingStudentOwnerColumns(supabase: SupabaseClient, table: string): Promise<string[]> {
  const out: string[] = [];
  for (const col of STUDENT_ORDER_OWNER_FK_CANDIDATES) {
    const { error } = await supabase.from(table).select(col).limit(1);
    if (!error) {
      out.push(col);
    }
  }
  return out;
}

function pickDeadlineRaw(row: Row): unknown {
  for (const k of ["proposed_due", "delivery_at", "deliver_by", "due_at", "deadline", "expected_delivery_at"] as const) {
    const v = row[k];
    if (v != null && String(v).trim()) {
      return v;
    }
  }
  return null;
}

function pickPaymentRaw(row: Row): string {
  for (const k of ["payment_status", "payment_state", "pay_status"] as const) {
    const v = row[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

function formatAmountLine(row: Row): string {
  for (const k of ["agreed_price", "proposed_price", "price", "amount", "total_amount"] as const) {
    const raw = row[k];
    if (raw == null) continue;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return `${raw.toLocaleString("ko-KR")}원`;
    }
    const s = String(raw).trim().replace(/[, ]/g, "");
    const n = Number(s);
    if (Number.isFinite(n)) {
      return `${n.toLocaleString("ko-KR")}원`;
    }
    if (String(raw).trim()) {
      return String(raw).trim();
    }
  }
  return "—";
}

/**
 * `public.custom_request_orders` 만 조회. 학생 소유 FK 컬럼(스키마에 존재하는 것들)으로 OR 필터.
 * RLS 오탐 대비로 클라이언트에서 `canAccessOrder` 재검증.
 */
export async function fetchStudentCustomRequestOrdersFromPrimaryTable(
  supabase: SupabaseClient,
  studentUserId: string,
  limit = 80
): Promise<{ rows: Row[]; error: string | null; probe: string }> {
  const t = CUSTOM_REQUEST_ORDERS_TABLE;
  const { error: pe } = await supabase.from(t).select("id").limit(1);
  if (pe) {
    return { rows: [], error: pe.message, probe: `${t}: 접근 불가` };
  }

  const ownerCols = await listExistingStudentOwnerColumns(supabase, t);
  if (ownerCols.length === 0) {
    return { rows: [], error: null, probe: `${t}: 학생 소유 FK 컬럼 없음` };
  }

  const orFilter = ownerCols.map((c) => `${c}.eq.${studentUserId}`).join(",");

  const o1 = await supabase.from(t).select("*").or(orFilter).order("updated_at", { ascending: false }).limit(limit);
  if (o1.error) {
    if (!/order|column/i.test(o1.error.message)) {
      return { rows: [], error: o1.error.message, probe: t };
    }
    const o2 = await supabase.from(t).select("*").or(orFilter).limit(limit);
    if (o2.error) {
      return { rows: [], error: o2.error.message, probe: t };
    }
    const raw = ((o2.data as Row[]) ?? []).filter((r) => canAccessOrder(r, studentUserId, "student").ok);
    return { rows: raw, error: null, probe: `${t} · OR(${ownerCols.join(",")}) · order 생략` };
  }
  const raw = ((o1.data as Row[]) ?? []).filter((r) => canAccessOrder(r, studentUserId, "student").ok);
  return { rows: raw, error: null, probe: `${t} · OR(${ownerCols.join(",")})` };
}

export type StudentCustomOrderListRowView = {
  id: string;
  idShort: string;
  titleLine: string;
  orderStatusLabel: string;
  paymentStatusLabel: string;
  amountLine: string;
  mentorLine: string;
  mentorId: string | null;
  createdLabel: string;
  deadlineLabel: string;
  workroomHref: string;
};

export async function enrichStudentCustomOrderListRows(
  supabase: SupabaseClient,
  rows: Row[]
): Promise<StudentCustomOrderListRowView[]> {
  const mentorIds = [...new Set(rows.map((r) => pickMentorIdFromOrderRow(r)).filter((x): x is string => !!x))];
  const { byUser: profByUser } = await loadMentorProfilesForDirectory(supabase, mentorIds);
  const userById = new Map<string, Awaited<ReturnType<typeof getMentorUserPublic>>["data"]>();

  await Promise.all(
    mentorIds.map(async (mid) => {
      const { data } = await getMentorUserPublic(supabase, mid);
      userById.set(mid, data);
    })
  );

  const out: StudentCustomOrderListRowView[] = [];
  for (const r of rows) {
    const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : null;
    if (!id) continue;

    const mid = pickMentorIdFromOrderRow(r);
    const profRow = mid ? profByUser.get(mid) ?? null : null;
    const urow = mid ? userById.get(mid) ?? null : null;
    const display = buildMentorProfileDisplay(profRow, urow);
    const mentorLine =
      mid && display.displayName.trim() && display.displayName !== "멘토"
        ? display.displayName
        : mid
          ? `멘토 ${shortOrderIdForDisplay(mid)}`
          : "—";

    const norm = normalizedPrimaryOrderStatus(r);
    const orderStatusLabel = norm ? orderStatusLabelForUi(norm) : "—";
    const payRaw = pickPaymentRaw(r);
    const paymentStatusLabel = payRaw ? paymentStatusLabelForUi(payRaw) : "—";

    const createdLabel = formatOrderRoomDate(r.created_at ?? null);
    const deadlineLabel = formatOrderRoomDate(pickDeadlineRaw(r));

    out.push({
      id,
      idShort: id.length <= 16 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`,
      titleLine: pickStudentOrderTitleLine(r),
      orderStatusLabel,
      paymentStatusLabel,
      amountLine: formatAmountLine(r),
      mentorLine,
      mentorId: mid,
      createdLabel,
      deadlineLabel,
      workroomHref: mentorCustomOrderWorkroomHref(id),
    });
  }
  return out;
}

export function pickStudentOrderTitleLine(row: Row): string {
  const title = pickDisplayField(row, ["title", "subject", "label", "name"]);
  return title !== "—" ? title : "맞춤의뢰 주문";
}
