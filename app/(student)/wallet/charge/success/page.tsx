import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";
import { loadStudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { parseWalletBalanceKrw } from "@/lib/cash/parseWalletBalanceKrw";
import { fetchWalletBalanceByUserId } from "@/lib/cash/cashQueries";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export default async function WalletChargeSuccessPage({ searchParams }: Props) {
  const { user, profile } = await requireRole("student");
  const sp = (await searchParams) ?? {};

  const paymentKey = one(sp, "paymentKey");
  const orderId = one(sp, "orderId");
  const amountRaw = one(sp, "amount");
  const amount = amountRaw ? Number(amountRaw) : Number.NaN;

  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
    redirect("/wallet/charge?error=" + encodeURIComponent("결제 정보가 올바르지 않습니다."));
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const cookieHeader = (await headers()).get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/api/toss/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    const msg = body?.message ?? "충전 확인에 실패했습니다.";
    redirect("/wallet/charge?error=" + encodeURIComponent(msg));
  }

  const supabase = await createClient();
  const balance = await fetchWalletBalanceByUserId(supabase, user.id);
  const balanceKrw = parseWalletBalanceKrw(balance.row);

  const bundle = await loadStudentMypageBundle(
    supabase,
    user.id,
    profile,
    null
  );

  return (
    <StudentDashboardShell activeTab="wallet" user={user} profile={profile} profileLoadError={null} bundle={bundle}>
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">충전이 완료됐습니다</h1>
        <p className="text-sm text-slate-700">
          <span className="font-bold">{amount.toLocaleString("ko-KR")}원</span>이 캐시에 반영되었습니다.
        </p>
        <p className="text-sm text-slate-600">
          현재 잔액: <span className="font-bold text-slate-900">{balanceKrw.toLocaleString("ko-KR")}원</span>
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/wallet/ledger" className="text-sm font-bold text-blue-700 hover:underline">
            사용 내역 보기 &rarr;
          </Link>
          <Link href="/wallet/charge" className="text-sm font-bold text-slate-600 hover:underline">
            충전 페이지
          </Link>
        </div>
      </div>
    </StudentDashboardShell>
  );
}
