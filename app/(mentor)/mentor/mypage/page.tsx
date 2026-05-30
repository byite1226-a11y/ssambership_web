import Link from "next/link";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardQueries";
import { MentorDashboardKpiCards } from "@/components/mentor/dashboard/MentorDashboardKpiCards";
import { MentorDashboardActiveOrdersTable } from "@/components/mentor/dashboard/MentorDashboardActiveOrdersTable";
import { formatCashKrw } from "@/lib/utils/formatDisplay";
import type { MentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardTypes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRIMARY = "#1A56DB";

/** Hub 로딩 실패 시에도 KPI/주문/수익 카드가 빈 모양으로 그려지도록 안전한 기본값. */
const SAFE_KPI_FALLBACK: MentorHubDashboardData["kpis"] = {
  newQuestions: 0,
  activeSubscribers: 0,
  newRequestsOpen: 0,
  newRequestsToday: 0,
  monthlyRevenue: 0,
  monthlyRevenueMomPct: null,
  avgRating: null,
  reviewCount: 0,
};

function verificationLabel(status: string | null): { label: string; tone: "ok" | "pending" | "none" } {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "approved" || s === "verified") return { label: "인증 완료", tone: "ok" };
  if (s === "pending" || s === "in_review" || s === "submitted") return { label: "인증 검토중", tone: "pending" };
  if (s === "rejected") return { label: "인증 반려", tone: "none" };
  return { label: "미인증", tone: "none" };
}

/**
 * 멘토 마이페이지 = 통합 홈(이전 `/mentor/dashboard` 역할 흡수).
 * - 프로필 헤더 / KPI 5 / 진행 중 의뢰 Top 3 / 빠른 이동 4 / 수익 현황 요약
 * - DB 조회 실패해도 UI가 깨지지 않도록 모든 영역에 안전한 fallback 적용.
 */
export default async function MentorMypagePage() {
  const { user, profile } = await requireRole("mentor");
  const supabase = await createClient();

  // Hub 통합 데이터 (KPIs, activeOrders, revenuePanel, rating)
  let hub: MentorHubDashboardData | null = null;
  try {
    hub = await loadMentorHubDashboardData(supabase, user.id);
  } catch {
    hub = null;
  }

  // 인증 상태는 Hub 페이로드에 없으므로 별도 조회.
  let verificationStatus: string | null = null;
  try {
    const { data: row, error } = await supabase
      .from("mentor_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && row) {
      const v = (row as { verification_status?: unknown }).verification_status;
      verificationStatus = typeof v === "string" ? v : null;
    }
  } catch {
    /* fallback: 미인증 표시 */
  }

  const displayName =
    profile?.nickname?.trim() ||
    profile?.full_name?.trim() ||
    "멘토";
  const verification = verificationLabel(verificationStatus);

  const kpis = hub?.kpis ?? SAFE_KPI_FALLBACK;
  const ratingAvg = hub?.rating?.avg ?? null;
  const reviewCount = hub?.rating?.count ?? 0;
  const newQuestions = kpis.newQuestions;
  const activeOrdersTop = (hub?.activeOrders ?? []).slice(0, 3);
  const revenue = hub?.revenuePanel;

  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* 1) 프로필 헤더 */}
      <header className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">멘토 마이페이지</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{displayName}님</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 font-bold",
                  verification.tone === "ok"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : verification.tone === "pending"
                      ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                ].join(" ")}
              >
                {verification.label}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-800 ring-1 ring-blue-200">
                {ratingAvg != null ? `평점 ${ratingAvg.toFixed(1)} · 후기 ${reviewCount}개` : "후기 없음"}
              </span>
            </div>
          </div>
          <Link
            href="/mentor/profile/edit"
            className="inline-flex shrink-0 items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:shadow"
            style={{ backgroundColor: PRIMARY }}
          >
            프로필 관리
          </Link>
        </div>
      </header>

      {/* 2) KPI 5개 */}
      <section>
        <MentorDashboardKpiCards kpis={kpis} />
      </section>

      {/* 3) 진행 중 의뢰 Top 3 */}
      <section>
        <MentorDashboardActiveOrdersTable orders={activeOrdersTop} />
      </section>

      {/* 4) 빠른 이동 카드 */}
      <section>
        <h2 className="text-lg font-black text-slate-900 sm:text-xl">빠른 이동</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard
            href="/mentor/question-room"
            title="질문방"
            desc="학생 질문 응답·노트 관리"
            badge={newQuestions > 0 ? `답변 대기 ${newQuestions}건` : null}
          />
          <QuickCard
            href="/mentor/custom-request/dashboard"
            title="맞춤의뢰"
            desc="진행 중 의뢰·납품 관리"
          />
          <QuickCard
            href="/mentor/payouts"
            title="정산 / 수익"
            desc="월간 정산 내역과 지급 일정"
          />
          <QuickCard
            href="/mentor/profile/edit"
            title="프로필 관리"
            desc="자기소개·전공·증빙서류 수정"
          />
        </div>
      </section>

      {/* 5) 수익 현황 요약 */}
      <section className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">수익 현황 요약</h2>
            <p className="mt-1 text-sm text-slate-500">{revenue?.monthLabel ?? "이번 달"} 기준</p>
          </div>
          <Link
            href="/mentor/payouts"
            className="text-sm font-bold underline underline-offset-2"
            style={{ color: PRIMARY }}
          >
            정산 상세 보기 →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RevenueCell label="총 예상 수익" amount={revenue?.totalExpected ?? 0} primary />
          <RevenueCell label="진행 중" amount={revenue?.inProgress ?? 0} />
          <RevenueCell label="완료(정산 예정)" amount={revenue?.completedPending ?? 0} />
        </div>
      </section>
    </main>
  );
}

function QuickCard(props: { href: string; title: string; desc: string; badge?: string | null }) {
  return (
    <Link
      href={props.href}
      className="group block rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#1A56DB] hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-black sm:text-lg" style={{ color: PRIMARY }}>
          {props.title}
        </p>
        {props.badge ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-200">
            {props.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-slate-600">{props.desc}</p>
      <p className="mt-3 text-xs font-bold text-slate-400 group-hover:text-slate-600">바로 이동 →</p>
    </Link>
  );
}

function RevenueCell(props: { label: string; amount: number; primary?: boolean }) {
  return (
    <div
      className={[
        "rounded-2xl p-5",
        props.primary ? "border-2 border-blue-200 bg-blue-50/60" : "border border-slate-200 bg-white",
      ].join(" ")}
    >
      <p className="text-xs font-bold text-slate-500">{props.label}</p>
      <p
        className="mt-2 text-2xl font-black tabular-nums"
        style={{ color: props.primary ? PRIMARY : undefined }}
      >
        {formatCashKrw(props.amount)}
      </p>
    </div>
  );
}
