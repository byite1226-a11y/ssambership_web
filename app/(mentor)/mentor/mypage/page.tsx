import Link from "next/link";
import { Inbox, Star, UserCog, Users } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardQueries";
import { formatCashKrw } from "@/lib/utils/formatDisplay";
import type {
  MentorHubDashboardData,
  MentorHubOrderRow,
} from "@/lib/mentor/dashboard/mentorHubDashboardTypes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRIMARY = "#1A56DB";
const MONTHS_BACK = 3;

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

type MonthlyBar = { key: string; label: string; amount: number; isCurrent: boolean };
type VerificationToken = { label: string; tone: "ok" | "pending" | "none" };

function verificationLabel(status: string | null): VerificationToken {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "approved" || s === "verified") return { label: "인증 완료", tone: "ok" };
  if (s === "pending" || s === "in_review" || s === "submitted") return { label: "인증 검토중", tone: "pending" };
  if (s === "rejected") return { label: "인증 반려", tone: "none" };
  return { label: "미인증", tone: "none" };
}

function initialOf(name: string): string {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : "M";
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 최근 MONTHS_BACK개월 정산 합계(맞춤의뢰 mentor_amount). 실패 시 0 배열. */
async function loadRecentMonthlyEarnings(
  supabase: SupabaseClient,
  mentorId: string,
): Promise<MonthlyBar[]> {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthKey(d), 0);
  }
  const start = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1);

  try {
    const { data, error } = await supabase
      .from("custom_order_settlement_items")
      .select("created_at, mentor_amount")
      .eq("mentor_id", mentorId)
      .gte("created_at", start.toISOString());
    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ created_at?: unknown; mentor_amount?: unknown }>) {
        const at = row.created_at;
        if (typeof at !== "string") continue;
        const d = new Date(at);
        if (Number.isNaN(d.getTime())) continue;
        const key = monthKey(d);
        if (!buckets.has(key)) continue;
        const amt = typeof row.mentor_amount === "number" ? row.mentor_amount : Number(row.mentor_amount ?? 0);
        if (Number.isFinite(amt) && amt > 0) {
          buckets.set(key, (buckets.get(key) ?? 0) + amt);
        }
      }
    }
  } catch {
    /* 빈 차트로 폴백 */
  }

  const currentKey = monthKey(now);
  return Array.from(buckets.entries()).map(([key, amount]) => ({
    key,
    label: `${parseInt(key.slice(5), 10)}월`,
    amount,
    isCurrent: key === currentKey,
  }));
}

/**
 * 멘토 마이페이지 — 단순화된 정보 구조.
 * 섹션: 프로필 / 수익 하이라이트(차트) / 핵심 KPI 2 / 진행 의뢰 / 프로필 CTA.
 * 빠른 이동은 상단 네비와 중복이라 제거.
 */
export default async function MentorMypagePage() {
  const { user, profile } = await requireRole("mentor");
  const supabase = await createClient();

  let hub: MentorHubDashboardData | null = null;
  try {
    hub = await loadMentorHubDashboardData(supabase, user.id);
  } catch {
    hub = null;
  }

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
    /* fallback: 미인증 */
  }

  const monthly = await loadRecentMonthlyEarnings(supabase, user.id);

  const displayName = profile?.nickname?.trim() || profile?.full_name?.trim() || "멘토";
  const verification = verificationLabel(verificationStatus);
  const kpis = hub?.kpis ?? SAFE_KPI_FALLBACK;
  const ratingAvg = hub?.rating?.avg ?? kpis.avgRating ?? null;
  const reviewCount = hub?.rating?.count ?? kpis.reviewCount;
  const activeOrdersTop = (hub?.activeOrders ?? []).slice(0, 3);
  const revenue = hub?.revenuePanel;

  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:space-y-10">
      <ProfileHeader
        displayName={displayName}
        verification={verification}
        ratingAvg={ratingAvg}
        reviewCount={reviewCount}
      />

      <RevenueHighlight revenue={revenue} monthly={monthly} />

      <CoreKpis activeSubscribers={kpis.activeSubscribers} ratingAvg={ratingAvg} reviewCount={reviewCount} />

      <ActiveOrdersSection orders={activeOrdersTop} />

      <ProfileCtaBanner />
    </main>
  );
}

/* ─────────── Profile Header ─────────── */

function ProfileHeader(props: {
  displayName: string;
  verification: VerificationToken;
  ratingAvg: number | null;
  reviewCount: number;
}) {
  const { displayName, verification, ratingAvg, reviewCount } = props;
  const initial = initialOf(displayName);
  const tone =
    verification.tone === "ok"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : verification.tone === "pending"
        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  return (
    <header className="rounded-2xl border-b border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-5">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white shadow-md sm:h-20 sm:w-20 sm:text-3xl"
          style={{ backgroundColor: PRIMARY }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">멘토 마이페이지</p>
          <h1 className="mt-1 truncate text-2xl font-black text-slate-900 sm:text-3xl">{displayName}님</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>
              {verification.label}
            </span>
            <StarLine value={ratingAvg} count={reviewCount} />
          </div>
        </div>
      </div>
    </header>
  );
}

function StarLine({ value, count }: { value: number | null; count: number }) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
        <Star className="h-3.5 w-3.5 text-slate-300" />
        후기 없음
      </span>
    );
  }
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
      <span className="inline-flex items-center" aria-label={`평점 ${value.toFixed(1)} / 5.0`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
          />
        ))}
      </span>
      <span className="tabular-nums">{value.toFixed(1)}</span>
      <span className="font-medium text-slate-500">· 후기 {count}개</span>
    </span>
  );
}

/* ─────────── Revenue Highlight (3개월 막대차트) ─────────── */

function RevenueHighlight({
  revenue,
  monthly,
}: {
  revenue: MentorHubDashboardData["revenuePanel"] | undefined;
  monthly: MonthlyBar[];
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">이번 달 수익</h2>
          <p className="mt-1 text-xs text-slate-500">{revenue?.monthLabel ?? "이번 달"} 기준</p>
        </div>
        <Link
          href="/mentor/payouts"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#1A56DB] hover:underline"
        >
          정산 상세 보기 <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <p className="text-xs font-bold text-slate-500">총 예상 수익</p>
          <p
            className="mt-1 text-4xl font-black tabular-nums sm:text-5xl"
            style={{ color: PRIMARY }}
          >
            {formatCashKrw(revenue?.totalExpected ?? 0)}
          </p>
          <div className="mt-5 flex items-end gap-5 sm:gap-7">
            <div>
              <p className="text-xs font-bold text-slate-500">진행 중</p>
              <p className="mt-1 text-lg font-black tabular-nums text-slate-900">
                {formatCashKrw(revenue?.inProgress ?? 0)}
              </p>
            </div>
            <div className="h-10 w-px self-end bg-slate-100" />
            <div>
              <p className="text-xs font-bold text-slate-500">완료(정산 예정)</p>
              <p className="mt-1 text-lg font-black tabular-nums text-slate-900">
                {formatCashKrw(revenue?.completedPending ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <MonthlyBarChart monthly={monthly} />
      </div>
    </section>
  );
}

function MonthlyBarChart({ monthly }: { monthly: MonthlyBar[] }) {
  const max = Math.max(1, ...monthly.map((m) => m.amount));
  const hasAny = monthly.some((m) => m.amount > 0);
  return (
    <div className="w-full">
      <p className="text-xs font-bold text-slate-500">최근 3개월</p>
      <div
        className="mt-2 flex items-end justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
        style={{ height: "140px" }}
        aria-label="최근 3개월 정산 수익 비교"
      >
        {monthly.map((m) => {
          const pct = max > 0 ? (m.amount / max) * 100 : 0;
          const heightPct = m.amount > 0 ? Math.max(pct, 8) : 4;
          return (
            <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={`text-[10px] font-bold tabular-nums ${m.isCurrent ? "text-[#1A56DB]" : "text-slate-500"}`}
              >
                {m.amount > 0
                  ? new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(m.amount)
                  : "—"}
              </span>
              <div
                className={`w-full max-w-[44px] rounded-t-md transition ${
                  m.isCurrent ? "bg-[#1A56DB]" : "bg-slate-300"
                } ${m.amount === 0 ? "opacity-60" : ""}`}
                style={{ height: `${heightPct}%` }}
                aria-hidden
              />
              <span className={`text-[10px] font-bold ${m.isCurrent ? "text-[#1A56DB]" : "text-slate-500"}`}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
      {!hasAny ? (
        <p className="mt-2 text-[11px] text-slate-400">아직 정산 기록이 없어요</p>
      ) : null}
    </div>
  );
}

/* ─────────── Core KPIs (2 only — 네비와 미중복) ─────────── */

function CoreKpis({
  activeSubscribers,
  ratingAvg,
  reviewCount,
}: {
  activeSubscribers: number;
  ratingAvg: number | null;
  reviewCount: number;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1A56DB]">
            <Users className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold text-slate-600">구독 학생</p>
        </div>
        <p className="mt-4 text-3xl font-black tabular-nums text-slate-900">
          {activeSubscribers}
          <span className="ml-1 text-base font-bold text-slate-500">명</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">현재 나와 연결된 활성 구독 학생 수</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Star className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold text-slate-600">평점</p>
        </div>
        <p className="mt-4 text-3xl font-black tabular-nums text-slate-900">
          {ratingAvg != null ? ratingAvg.toFixed(1) : "—"}
          <span className="ml-1 text-base font-bold text-slate-500">/ 5.0</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">총 후기 {reviewCount}개의 평균</p>
      </article>
    </section>
  );
}

/* ─────────── Active Orders ─────────── */

function ActiveOrdersSection({ orders }: { orders: MentorHubOrderRow[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900">진행 중 의뢰</h2>
        <Link
          href="/mentor/custom-request/orders"
          className="text-sm font-bold text-slate-500 hover:text-[#1A56DB]"
        >
          전체보기 <span aria-hidden>›</span>
        </Link>
      </div>
      <div className="mt-4">{orders.length === 0 ? <EmptyOrders /> : <OrderList orders={orders} />}</div>
    </section>
  );
}

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
        <Inbox className="h-7 w-7 text-slate-300" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-bold text-slate-700">진행 중인 의뢰가 없어요</p>
      <p className="mt-1 text-xs text-slate-500">새 의뢰가 들어오면 여기에서 바로 관리할 수 있어요.</p>
    </div>
  );
}

function OrderList({ orders }: { orders: MentorHubOrderRow[] }) {
  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id}>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-[#1A56DB]"
                aria-hidden
              >
                {order.studentInitial}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-bold text-slate-900">{order.title}</h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    {order.categoryLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {order.studentName} · 최근 활동 {order.recentActivity}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      order.ddayUrgent
                        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                        : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                    }`}
                  >
                    {order.dday}
                    {order.deadlineDate ? (
                      <span className="ml-1 font-medium opacity-70">· {order.deadlineDate}</span>
                    ) : null}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${order.statusClassName}`}
                  >
                    {order.statusLabel}
                  </span>
                </div>
              </div>
              <Link
                href={order.workroomHref}
                className="hidden shrink-0 items-center gap-1 self-start rounded-lg px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow sm:inline-flex"
                style={{ backgroundColor: PRIMARY }}
              >
                바로가기 →
              </Link>
            </div>
            <Link
              href={order.workroomHref}
              className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-white shadow-sm sm:hidden"
              style={{ backgroundColor: PRIMARY }}
            >
              바로가기 →
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
}

/* ─────────── Bottom CTA Banner ─────────── */

function ProfileCtaBanner() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/60 px-6 py-10 text-center sm:px-10">
      <p className="text-base font-bold text-slate-900 sm:text-lg">
        프로필을 완성하면 더 많은 학생이 찾아와요!
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        자기소개·전공·증빙서류를 업데이트하면 학생들의 신뢰도가 올라가요.
      </p>
      <Link
        href="/mentor/profile/edit"
        className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:shadow-lg"
        style={{ backgroundColor: PRIMARY }}
      >
        <UserCog className="h-4 w-4" />
        프로필 관리하기
      </Link>
    </section>
  );
}
