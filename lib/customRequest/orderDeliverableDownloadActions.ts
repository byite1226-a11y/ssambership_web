"use server";

import { redirect } from "next/navigation";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { canAccessOrder } from "@/lib/customRequest/orderAccess";
import {
  firstReadableCustomTable,
  ORDER_TO_DELIVERABLE_FK_CANDIDATES,
} from "@/lib/customRequest/customRequestQueries";
import { DELIVERABLE_STORAGE_BUCKET, pickStoragePathFromDeliverableRow } from "@/lib/customRequest/orderDeliverableFiles";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

function orderPath(orderId: string) {
  return `/custom-request/orders/${encodeURIComponent(orderId)}`;
}

/**
 * 납품 첨부 다운로드(비공개 버킷) — signed URL로 리다이렉트.
 * 주문 당사자(학생·멘토)·관리자만. 경로는 DB `storage_path` / `file_path` 등.
 */
export async function downloadCustomOrderDeliverableAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const deliverableId = String(formData.get("deliverableId") ?? "").trim();
  if (!orderId || !deliverableId) {
    redirect("/custom-request?error=" + encodeURIComponent("다운로드 요청이 올바르지 않습니다."));
  }

  const { user, profile } = await getServerUserWithProfile();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent(orderPath(orderId)));
  }
  const role = profile?.role as AppRole | undefined;
  if (role !== "student" && role !== "mentor" && role !== "admin") {
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("다운로드 권한이 없습니다."));
  }

  const supabase = await createClient();

  const oT = await firstReadableCustomTable(supabase, ["custom_request_orders", "custom_orders", "request_orders"]);
  if (!oT.table) {
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("주문을 찾을 수 없습니다."));
  }
  const { data: orderRow, error: oe } = await supabase.from(oT.table).select("*").eq("id", orderId).maybeSingle();
  if (oe || !orderRow) {
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("주문을 찾을 수 없습니다."));
  }
  const access = canAccessOrder(orderRow as Row, user.id, role ?? "student");
  if (!access.ok) {
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("이 납품을 다운로드할 권한이 없습니다."));
  }

  const dT = await firstReadableCustomTable(supabase, ["custom_order_deliverables", "order_deliverables", "request_deliverables"]);
  if (!dT.table) {
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("납품 테이블을 찾을 수 없습니다."));
  }
  const { column: fk } = await pickExistingColumn(supabase, dT.table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
  if (!fk) {
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("납품 스키마를 확인할 수 없습니다."));
  }

  const { data: drow, error: de } = await supabase
    .from(dT.table)
    .select("*")
    .eq("id", deliverableId)
    .eq(fk, orderId)
    .maybeSingle();
  if (de || !drow) {
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("해당 납품을 찾을 수 없습니다."));
  }

  const path = pickStoragePathFromDeliverableRow(drow as Row);
  if (!path || path.startsWith("http://") || path.startsWith("https://")) {
    if (path?.startsWith("http")) {
      redirect(path);
    }
    redirect(orderPath(orderId) + "?error=" + encodeURIComponent("이 납품에 연결된 스토리지 파일이 없습니다(텍스트-only 납품)."));
  }

  const { data: signed, error: se } = await supabase.storage
    .from(DELIVERABLE_STORAGE_BUCKET)
    .createSignedUrl(path, 120);
  if (se || !signed?.signedUrl) {
    redirect(
      orderPath(orderId) + "?error=" + encodeURIComponent(se?.message ?? "다운로드 링크를 만들 수 없습니다. 잠시 후 다시 시도하세요.")
    );
  }
  redirect(signed.signedUrl);
}
