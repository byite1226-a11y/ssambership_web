import Link from "next/link";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { fetchWalletBalanceByUserId } from "@/lib/cash/cashQueries";
import { parseWalletBalanceBreakdown } from "@/lib/cash/parseWalletBalanceKrw";
import { WalletChargeSidebar } from "@/components/cash/WalletChargeSidebar";
import { MentorSubscribeSummaryCard } from "@/components/subscribe/MentorSubscribeSummaryCard";
import { SubscribeCheckoutClient, type SubscribePlanOption } from "@/components/subscribe/SubscribeCheckoutClient";
import { loadStudentSubscribePage } from "@/lib/subscribe/subscribePageQueries";
import {
  SUBSCRIBE_PLAN_CATALOG,
  planIdFromRow,
} from "@/lib/subscribe/subscribePlanCatalog";
import { USER_UI_LOAD_FAILED } from "@/lib/constants/userFacingMessages";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" && v ? v : undefined;
}

export default async function StudentSubscribePage(props: Props) {
  const { user } = await requireRole("student");
  const sp = (await props.searchParams) ?? {};
  const mentorId = one(sp, "mentorId") ?? null;

  const supabase = await createClient();

  if (!mentorId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-black text-slate-900">멘토를 먼저 선택해 주세요</h1>
        <p className="mt-2 text-sm text-slate-600">멘토 목록에서 구독하기를 눌러 이 화면으로 이동할 수 있어요.</p>
        <Link href="/mentors" className="mt-6 inline-block font-bold text-blue-600 hover:underline">
          멘토 찾기 &rarr;
        </Link>
      </div>
    );
  }

  const [data, balance] = await Promise.all([
    loadStudentSubscribePage(supabase, { mentorId, studentId: user.id }),
    fetchWalletBalanceByUserId(supabase, user.id),
  ]);
  const breakdown = parseWalletBalanceBreakdown(balance.row);

  if (data.kind === "no_mentor" || data.kind === "mentor_error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-black text-slate-900">멘토 정보를 불러오지 못했어요</h1>
        <p className="mt-2 text-sm text-slate-600">{USER_UI_LOAD_FAILED}</p>
        <Link href="/mentors" className="mt-6 inline-block font-bold text-blue-600 hover:underline">
          멘토 찾기 &rarr;
        </Link>
      </div>
    );
  }

  const plans: SubscribePlanOption[] = SUBSCRIBE_PLAN_CATALOG.map((catalog) => ({
    ...catalog,
    planId: planIdFromRow(data.byTier[catalog.tier] as Record<string, unknown> | null),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 antialiased">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-8">
          <MentorSubscribeSummaryCard mentorId={data.mentorId} display={data.display} />
          <WalletChargeSidebar breakdown={breakdown} balanceError={balance.error} />
        </div>

        <main className="min-w-0">
          <header className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">멘토 구독</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data.display.displayName} 멘토와 연결할 플랜을 선택하세요.
            </p>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SubscribeCheckoutClient
              mentorId={data.mentorId}
              plans={plans}
              currentBalanceCash={breakdown.totalCash}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
