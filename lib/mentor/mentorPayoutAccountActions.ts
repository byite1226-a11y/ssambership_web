"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/routeGuard";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import { createClient } from "@/lib/supabase/server";

const PATH = "/mentor/payouts";

export async function updateMentorPayoutAccountAction(formData: FormData) {
  const { user } = await requireRole("mentor");
  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").replace(/\D/g, "").trim();

  if (!bankName) {
    return { ok: false as const, error: "은행을 선택해 주세요." };
  }
  if (!accountNumber || accountNumber.length < 8 || accountNumber.length > 24) {
    return { ok: false as const, error: "계좌번호는 숫자 8~24자리로 입력해 주세요." };
  }

  const supabase = await createClient();
  const bankCol = await pickExistingColumn(supabase, "mentor_profiles", ["payout_bank_name", "bank_name"]);
  const acctCol = await pickExistingColumn(supabase, "mentor_profiles", [
    "payout_account_number",
    "bank_account_number",
    "account_number",
  ]);

  if (!bankCol.column || !acctCol.column) {
    return { ok: false as const, error: "계좌 정보 저장 기능을 준비 중입니다." };
  }

  const patch: Record<string, string> = {
    [bankCol.column]: bankName,
    [acctCol.column]: accountNumber,
  };

  const { data, error } = await supabase.from("mentor_profiles").update(patch).eq("user_id", user.id).select("user_id").maybeSingle();
  if (error || !data) {
    return { ok: false as const, error: "계좌 정보를 저장하지 못했습니다." };
  }

  revalidatePath(PATH);
  return { ok: true as const };
}
