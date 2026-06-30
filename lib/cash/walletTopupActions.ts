"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { recoverPastDueAfterTopup } from "@/lib/toss/cashTopupFromPayment";

const MAX_CENTS = 1_000_000_000;

function textFromForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * DB `balance_cents` / `delta_cents` (004) — 구독 캐시·플랜과 같이 “minor” 정수(표시 KRW(원) × 100)로 맞춘다.
 * 폼 “원(정수)” → RPC `p_amount_cents` = KRW(원) × 100
 */
function krwWonIntegerToCentsInt(won: number): number {
  if (!Number.isFinite(won) || won <= 0) return 0;
  if (won > 10_000_000) return 0;
  return Math.min(MAX_CENTS, Math.round(won) * 100);
}

function mapTopupError(raw: string): string {
  const t = String(raw);
  if (/p_amount_too_large|CASH_WALLET|too large/i.test(t) || t.includes("p_amount_too")) {
    return "충전 금액이 한도를 초과했습니다. 금액을 줄이고 다시 시도해 주세요.";
  }
  if (/positive|required|p_amount|idempotency|p_idempotency/i.test(t) && t.length < 200) {
    return "요청이 올바르지 않습니다. 금액·입력을 확인한 뒤 다시 시도해 주세요.";
  }
  if (/PGRST|pg_|https?:\/\//i.test(t) || t.length > 200) {
    return "캐시를 충전하는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "캐시를 충전하는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.";
}

const MSG_TEST_TOPUP_DISABLED = "테스트 충전은 현재 비활성화되어 있습니다.";

/**
 * `CASH_TOPUP_ALLOW_TEST_CHARGE` 가 `"true"` 일 때만 `record_cash_topup` (service role)로 원장+지갑을 기록.
 * NODE_ENV 로 자동 허용하지 않는다(운영 오탐 방지).
 */
export async function testWalletCashTopupAction(formData: FormData): Promise<void> {
  const { user } = await requireRole("student");

  if (process.env.NODE_ENV === "production") {
    if (process.env.CASH_TOPUP_ALLOW_TEST_CHARGE === "true") {
      throw new Error("CASH_TOPUP_ALLOW_TEST_CHARGE: 프로덕션에서는 허용되지 않습니다");
    }
    redirect("/wallet/charge?error=" + encodeURIComponent(MSG_TEST_TOPUP_DISABLED));
  }
  if (process.env.CASH_TOPUP_ALLOW_TEST_CHARGE !== "true") {
    redirect("/wallet/charge?error=" + encodeURIComponent(MSG_TEST_TOPUP_DISABLED));
  }
  console.warn(
    "[walletTopup] CASH_TOPUP_ALLOW_TEST_CHARGE=true — 테스트 충전이 활성화되어 있습니다(개발·스테이징 전용)."
  );

  const idem = textFromForm(formData.get("idempotencyKey")) || `cash_topup_${user.id}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const wonStr = textFromForm(formData.get("amountKrw"));
  const won = wonStr ? Number(wonStr) : Number.NaN;
  const amountCents = krwWonIntegerToCentsInt(won);

  if (wonStr === "" || !Number.isFinite(won) || !Number.isInteger(won) || won <= 0) {
    redirect(
      "/wallet/charge?error=" + encodeURIComponent("충전할 금액(원)을 1원 이상의 정수로 입력해 주세요.")
    );
  }
  if (amountCents <= 0 || won > 10_000_000) {
    redirect(
      "/wallet/charge?error=" + encodeURIComponent("충전 금액이 올바르지 않습니다. 1원 이상 1천만원 이하로 입력해 주세요.")
    );
  }
  if (!Number.isInteger(won)) {
    redirect("/wallet/charge?error=" + encodeURIComponent("충전 금액은 정수(원)로 입력해 주세요."));
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    if (m.includes("createServiceRoleClient") || m.includes("SUPABASE_SERVICE_ROLE_KEY") || m.includes("NEXT_PUBLIC_SUPABASE_URL")) {
      redirect(
        "/wallet/charge?error=" +
          encodeURIComponent("서버 설정 오류로 충전을 처리할 수 없습니다. 관리자에게 문의해 주세요.")
      );
    }
    console.error("[testWalletCashTopupAction] createServiceRoleClient", e);
    redirect(
      "/wallet/charge?error=" + encodeURIComponent("캐시를 충전하는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.")
    );
  }

  const { error } = await admin.rpc("record_cash_topup", {
    p_user_id: user.id,
    p_amount_cents: amountCents,
    p_idempotency_key: idem,
  });
  if (error) {
    const msg = mapTopupError(error.message);
    console.error("[testWalletCashTopupAction] record_cash_topup", error);
    redirect("/wallet/charge?error=" + encodeURIComponent(msg));
  }

  // P1 ① — 테스트 충전 직후 past_due 구독 즉시 복구
  await recoverPastDueAfterTopup(admin, user.id);

  revalidatePath("/wallet");
  revalidatePath("/wallet/charge");
  revalidatePath("/wallet/ledger");
  const ok = `테스트 충전이 완료되었습니다. (${new Intl.NumberFormat("ko-KR").format(won)}원이 반영되었습니다.)`;
  redirect("/wallet/charge?ok=" + encodeURIComponent(ok));
}
