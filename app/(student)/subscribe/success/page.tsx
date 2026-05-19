import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadStudentSubscribePage } from "@/lib/subscribe/subscribePageQueries";
import { getSubscribeCatalogPlan } from "@/lib/subscribe/subscribePlanCatalog";
import { isSubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function fmtCash(n: number): string {
  return `${n.toLocaleString("ko-KR")}캐시`;
}

export default async function SubscribeSuccessPage({ searchParams }: Props) {
  const { user } = await requireRole("student");
  const sp = (await searchParams) ?? {};

  const mentorId = one(sp, "mentorId");
  const planTierRaw = one(sp, "planTier");

  if (!mentorId || !planTierRaw || !isSubscribePlanTier(planTierRaw)) {
    redirect("/subscribe?error=" + encodeURIComponent("구독 정보가 올바르지 않습니다."));
  }

  const supabase = await createClient();
  const data = await loadStudentSubscribePage(supabase, {
    mentorId,
    studentId: user.id,
  });
  const mentorName = data.kind === "ok" ? data.display.displayName : "멘토";
  const plan = getSubscribeCatalogPlan(planTierRaw);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <section className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" strokeWidth={2.25} aria-hidden />
        <h1 className="mt-4 text-2xl font-black text-slate-900">구독이 완료됐습니다!</h1>
        <p className="mt-4 text-base text-slate-700">
          <span className="font-bold text-slate-900">{mentorName}</span> 멘토 ·{" "}
          <span className="font-bold text-blue-700">{plan.label}</span> 플랜
        </p>
        <p className="mt-2 text-sm text-slate-500">{fmtCash(plan.cashKrw)}가 캐시 잔액에서 차감되었습니다.</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/question-room"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500"
          >
            질문하러 가기
          </Link>
          <Link
            href="/mentors"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
          >
            멘토 더 찾기
          </Link>
        </div>
      </section>
    </div>
  );
}
