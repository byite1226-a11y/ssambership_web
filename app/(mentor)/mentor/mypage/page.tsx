import Link from "next/link";
import { Inbox, Star, Users } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorHubDashboardData } from "@/lib/mentor/dashboard/mentorHubDashboardQueries";
import type {
  MentorHubDashboardData,
  MentorHubOrderRow,
} from "@/lib/mentor/dashboard/mentorHubDashboardTypes";
import { MentorRevenueChart, type MonthlyRevenue } from "@/components/mentor/mypage/MentorRevenueChart";
import { loadMentorCapUsage, type MentorCapUsage } from "@/lib/subscribe/mentorCapService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MONTHS_BACK = 5;

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

/**
 * cash_ledger에서 멘토(user_id=mentorId)의 정산 인입 금액을 최근 N개월 월별 합산.
 * - append-only 원장. ref_type 컬럼 기준 (이름은 04* 스키마 정의대로).
 * - delta_cents 양수만 인입으로 간주(차감 제외).
 * - 빈 달은 0으로 채워 정확히 MONTHS_BACK개 반환.
 * - delta_cents는 cents(×100). KRW로 변환해 캐시(=원) 단위로 노출.
 * - RLS/스키마 실패 시 0 배열 폴백 → UI 깨지지 않음.
 */
async function loadRecentMonthlyRevenue(
  supabase: SupabaseClient,
  mentorId: string,
): Promise<MonthlyRevenue[]> {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthKey(d), 0);
  }
  const start = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1);

  try {
    const { data, error } = await supabase
      .from("cash_ledger")
      .select("created_at, delta_cents, ref_type")
      .eq("user_id", mentorId)
      .gt("delta_cents", 0)
      .gte("created_at", start.toISOString());
    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ created_at?: unknown; delta_cents?: unknown }>) {
        const at = row.created_at;
        if (typeof at !== "string") continue;
        const d = new Date(at);
        if (Number.isNaN(d.getTime())) continue;
        const key = monthKey(d);
        if (!buckets.has(key)) continue;
        const cents = typeof row.delta_cents === "number" ? row.delta_cents : Number(row.delta_cents ?? 0);
        if (Number.isFinite(cents) && cents > 0) {
          // cents → KRW (캐시 = 원)
          buckets.set(key, (buckets.get(key) ?? 0) + Math.round(cents / 100));
        }
      }
    }
  } catch {
    /* 0 배열 폴백 */
  }

  return Array.from(buckets.entries()).map(([key, total]) => ({
    month: `${parseInt(key.slice(5), 10)}월`,
    total,
  }));
}

/**
 * 멘토 마이페이지 v2 — 데스크탑 2컬럼.
 * 좌: 수익 카드(차트 포함) + 진행 의뢰 / 우: KPI 2.
 * 프로필 헤더는 상단 전체폭. 빠른 이동/프로필 CTA 카드는 네비·헤더와 중복이라 제외.
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

  const monthlyRevenue = await loadRecentMonthlyRevenue(supabase, user.id);
  const currentMonthLabel = monthlyRevenue[monthlyRevenue.length - 1]?.month ?? "이번 달";
  const capUsage = await loadMentorCapUsage(user.id);

  const displayName = profile?.nickname?.trim() || profile?.full_name?.trim() || "멘토";
  const verification = verificationLabel(verificationStatus);
  const kpis = hub?.kpis ?? SAFE_KPI_FALLBACK;
  const ratingAvg = hub?.rating?.avg ?? kpis.avgRating ?? null;
  const reviewCount = hub?.rating?.count ?? kpis.reviewCount;
  const activeOrdersTop = (hub?.activeOrders ?? []).slice(0, 3);
  const revenue = hub?.revenuePanel;

  return (
    <main className="mx-auto w-full max-w-6xl bg-[#fcfcfd] px-10 py-9">
      <ProfileHeader
        displayName={displayName}
        verification={verification}
        reviewCount={reviewCount}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
        {/* 좌 컬럼 */}
        <div className="min-w-0">
          <RevenueCard
            currentMonthLabel={currentMonthLabel}
            totalExpected={revenue?.totalExpected ?? 0}
            inProgress={revenue?.inProgress ?? 0}
            completedPending={revenue?.completedPending ?? 0}
            monthlyRevenue={monthlyRevenue}
          />

          <ActiveOrdersSection orders={activeOrdersTop} />
        </div>

        {/* 우 컬럼 */}
        <aside className="flex flex-col gap-5 lg:gap-5">
          <KpiPair
            activeSubscribers={kpis.activeSubscribers}
            ratingAvg={ratingAvg}
            reviewCount={reviewCount}
          />
          <CapUsageCard usage={capUsage} />
        </aside>
      </div>
    </main>
  );
}

/* ───────────────── Profile Header (전체폭) ───────────────── */

function ProfileHeader(props: {
  displayName: string;
  verification: VerificationToken;
  reviewCount: number;
}) {
  const { displayName, verification, reviewCount } = props;
  const initial = initialOf(displayName);
  const verifBadgeClass =
    verification.tone === "ok"
      ? "text-blue-600 bg-blue-50"
      : verification.tone === "pending"
        ? "text-amber-700 bg-amber-50"
        : "text-slate-500 bg-slate-100";
  const subline = reviewCount > 0 ? `후기 ${reviewCount}개` : "아직 등록된 후기가 없어요";

  return (
    <header className="mb-7 flex items-center gap-3.5">
      <div
        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white"
        aria-hidden
      >
        {initial}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-semibold tracking-tight text-[#1e2430]">{displayName}</h1>
          <span className={`rounded-[5px] px-2 py-0.5 text-[11px] font-medium ${verifBadgeClass}`}>
            {verification.label}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] text-slate-400">{subline}</p>
      </div>
    </header>
  );
}

/* ───────────────── Revenue Card (with 5-month chart) ───────────────── */

function RevenueCard(props: {
  currentMonthLabel: string;
  totalExpected: number;
  inProgress: number;
  completedPending: number;
  monthlyRevenue: MonthlyRevenue[];
}) {
  return (
    <section className="rounded-[14px] border border-[#eef0f3] bg-white px-[26px] py-6">
      <div className="mb-[18px] flex items-center justify-between">
        <p className="text-[13px] font-medium text-slate-400">
          이번 달 수익 · {props.currentMonthLabel}
        </p>
        <Link
          href="/mentor/payouts"
          className="text-[12px] font-medium text-blue-600 hover:underline"
        >
          정산 내역 보기 →
        </Link>
      </div>

      <p className="text-[42px] font-semibold leading-none tracking-[-1.6px] text-[#1e2430]">
        {Math.max(0, Math.round(props.totalExpected)).toLocaleString("ko-KR")}
        <span className="ml-1.5 text-base font-normal text-slate-400">캐시</span>
      </p>

      <div className="mt-3.5 flex gap-[26px]">
        <p className="text-[12px] text-slate-400">
          진행 중<span className="ml-1 font-semibold text-slate-600">{Math.round(props.inProgress).toLocaleString("ko-KR")}</span>
        </p>
        <p className="text-[12px] text-slate-400">
          정산 예정
          <span className="ml-1 font-semibold text-slate-600">
            {Math.round(props.completedPending).toLocaleString("ko-KR")}
          </span>
        </p>
      </div>

      <div className="-mx-2 mt-[22px] h-[130px]">
        <MentorRevenueChart monthlyRevenue={props.monthlyRevenue} />
      </div>
    </section>
  );
}

/* ───────────────── Active Orders ───────────────── */

function ActiveOrdersSection({ orders }: { orders: MentorHubOrderRow[] }) {
  return (
    <section>
      <div className="mb-3.5 mt-[30px] flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#1e2430]">진행 중 의뢰</h2>
        <Link
          href="/mentor/custom-request/orders"
          className="text-[12px] font-medium text-blue-600 hover:underline"
        >
          전체보기 →
        </Link>
      </div>
      {orders.length === 0 ? <EmptyOrders /> : <OrderList orders={orders} />}
    </section>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-[14px] border border-[#eef0f3] bg-white px-[26px] py-12 text-center">
      <div className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-slate-50">
        <Inbox className="h-5 w-5 text-slate-300" aria-hidden />
      </div>
      <p className="mt-3 text-[14px] font-medium text-slate-600">진행 중인 의뢰가 없어요</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
        새 의뢰가 들어오면 여기에서 바로 확인하고 관리할 수 있어요
      </p>
    </div>
  );
}

function OrderList({ orders }: { orders: MentorHubOrderRow[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <article className="rounded-[14px] border border-[#eef0f3] bg-white px-[26px] py-5 transition hover:border-blue-100">
            <div className="flex items-start gap-4">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[13px] font-semibold text-blue-600"
                aria-hidden
              >
                {order.studentInitial}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-[14px] font-semibold text-[#1e2430]">{order.title}</h3>
                  <span className="rounded-[5px] bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {order.categoryLabel}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-slate-400">
                  {order.studentName} · 최근 활동 {order.recentActivity}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-[5px] px-2 py-0.5 text-[11px] font-medium ${
                      order.ddayUrgent ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {order.dday}
                    {order.deadlineDate ? <span className="ml-1 opacity-70">· {order.deadlineDate}</span> : null}
                  </span>
                  <span className={`rounded-[5px] border px-2 py-0.5 text-[11px] font-medium ${order.statusClassName}`}>
                    {order.statusLabel}
                  </span>
                </div>
              </div>
              <Link
                href={order.workroomHref}
                className="hidden shrink-0 items-center gap-1 self-start rounded-[8px] bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-blue-700 sm:inline-flex"
              >
                바로가기 →
              </Link>
            </div>
            <Link
              href={order.workroomHref}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[8px] bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white sm:hidden"
            >
              바로가기 →
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────── Cap 사용량 (구독 수용량) ───────────────── */

function fmtCap(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function CapUsageCard({ usage }: { usage: MentorCapUsage }) {
  const { usedCap, capLimit, activeCount, pct, isFull } = usage;
  const warn = pct >= 80;
  const fillColor = isFull || pct >= 100 ? "#e08a2f" : warn ? "#e08a2f" : "#2563eb";

  return (
    <article className="rounded-2xl border border-[#edeef1] bg-white px-5 py-[18px]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-slate-500">구독 수용량</p>
        <p className="text-[13px] font-semibold text-slate-700 tabular-nums">
          {fmtCap(usedCap)} / {fmtCap(capLimit)}
        </p>
      </div>
      <div className="mt-3 h-[9px] w-full overflow-hidden rounded-md bg-slate-100">
        <div
          className="h-full rounded-md transition-all"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: fillColor }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        {isFull ? (
          <span className="font-semibold text-[#e08a2f]">구독 마감</span>
        ) : (
          `${activeCount}명 구독 중 · ${pct}% 사용`
        )}
      </p>
    </article>
  );
}

/* ───────────────── KPI Pair (구독 학생 / 평균 평점) ───────────────── */

function KpiPair(props: {
  activeSubscribers: number;
  ratingAvg: number | null;
  reviewCount: number;
}) {
  return (
    <>
      {/* lg 미만에서는 2열 */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="구독 학생"
          value={props.activeSubscribers.toLocaleString("ko-KR")}
          unit="명"
        />
        <KpiCard
          icon={<Star className="h-4 w-4" />}
          label="평균 평점"
          value={props.ratingAvg != null ? props.ratingAvg.toFixed(1) : "—"}
          unit="/ 5.0"
          dim={props.ratingAvg == null}
          footnote={props.reviewCount > 0 ? `리뷰 ${props.reviewCount}개 기준` : null}
        />
      </div>
    </>
  );
}

function KpiCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  dim?: boolean;
  footnote?: string | null;
}) {
  return (
    <article className="rounded-[14px] border border-[#eef0f3] bg-white px-[26px] py-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
          {props.icon}
        </span>
        <p className="text-[13px] font-medium text-slate-400">{props.label}</p>
      </div>
      <p
        className={`text-[28px] font-semibold tracking-tight ${
          props.dim ? "text-slate-300" : "text-[#1e2430]"
        }`}
      >
        {props.value}
        <span className="ml-1 text-[13px] font-normal text-slate-400">{props.unit}</span>
      </p>
      {props.footnote ? (
        <p className="mt-1 text-[11px] text-slate-400">{props.footnote}</p>
      ) : null}
    </article>
  );
}

