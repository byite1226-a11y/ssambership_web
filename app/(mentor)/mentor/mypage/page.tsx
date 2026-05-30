import Link from "next/link";
import {
  CircleDollarSign,
  ClipboardList,
  FileText,
  HelpCircle,
  Inbox,
  Star,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
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

/**
 * 멘토 마이페이지 = 통합 홈(이전 `/mentor/dashboard` 흡수).
 * UX 원칙: 프로필·KPI·진행 의뢰·빠른 이동·수익을 한 페이지에서 한눈에.
 * 모든 DB 영역은 try/catch + 안전한 fallback이라 깨지지 않음.
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
    <main className="mx-auto w-full max-w-[1280px] space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <ProfileHeader
        displayName={displayName}
        verification={verification}
        ratingAvg={ratingAvg}
        reviewCount={reviewCount}
      />

      <section>
        <KpiRow kpis={kpis} />
      </section>

      <section>
        <SectionHeading title="진행 중 의뢰" linkLabel="전체보기" linkHref="/mentor/custom-request/orders" />
        <div className="mt-3">
          <ActiveOrdersCardList orders={activeOrdersTop} />
        </div>
      </section>

      <section>
        <SectionHeading title="빠른 이동" />
        <div className="mt-3">
          <QuickLinksGrid newQuestions={newQuestions} />
        </div>
      </section>

      <RevenueSummary revenue={revenue} />
    </main>
  );
}

/* ───────────────── Profile Header ───────────────── */

function ProfileHeader(props: {
  displayName: string;
  verification: VerificationToken;
  ratingAvg: number | null;
  reviewCount: number;
}) {
  const { displayName, verification, ratingAvg, reviewCount } = props;
  const initial = initialOf(displayName);
  const verifToneClass =
    verification.tone === "ok"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : verification.tone === "pending"
        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  return (
    <header className="rounded-2xl border-b border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
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
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${verifToneClass}`}>
                {verification.label}
              </span>
              <StarRating value={ratingAvg} count={reviewCount} />
            </div>
          </div>
        </div>
        <Link
          href="/mentor/profile/edit"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-blue-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:border-[#1A56DB] hover:bg-blue-50"
        >
          <UserCog className="h-4 w-4" style={{ color: PRIMARY }} />
          프로필 관리
        </Link>
      </div>
    </header>
  );
}

function StarRating({ value, count }: { value: number | null; count: number }) {
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

/* ───────────────── Section Heading ───────────────── */

function SectionHeading({
  title,
  linkLabel,
  linkHref,
}: {
  title: string;
  linkLabel?: string;
  linkHref?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {linkLabel && linkHref ? (
        <Link href={linkHref} className="text-sm font-bold text-slate-500 hover:text-[#1A56DB]">
          {linkLabel} <span aria-hidden>›</span>
        </Link>
      ) : null}
    </div>
  );
}

/* ───────────────── KPI Row ───────────────── */

function KpiRow({ kpis }: { kpis: MentorHubDashboardData["kpis"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      <KpiCard
        icon={HelpCircle}
        label="새 질문"
        value={`${kpis.newQuestions}건`}
        sub="답변 대기"
        tone="danger"
        highlightOn={kpis.newQuestions > 0}
      />
      <KpiCard
        icon={Users}
        label="구독 학생"
        value={`${kpis.activeSubscribers}명`}
        sub="활성 구독자"
      />
      <KpiCard
        icon={FileText}
        label="새 의뢰"
        value={`${kpis.newRequestsOpen}건`}
        sub={`오늘 +${kpis.newRequestsToday}건`}
      />
      <KpiCard
        icon={CircleDollarSign}
        label="이번 달 수익"
        value={formatCashKrw(kpis.monthlyRevenue)}
        sub={
          kpis.monthlyRevenueMomPct != null
            ? `전월 대비 ${kpis.monthlyRevenueMomPct > 0 ? "+" : ""}${kpis.monthlyRevenueMomPct.toFixed(1)}%`
            : "기준 비교 없음"
        }
        tone="primary"
      />
      <KpiCard
        icon={Star}
        label="평점"
        value={kpis.avgRating != null ? kpis.avgRating.toFixed(1) : "—"}
        sub={`리뷰 ${kpis.reviewCount}개`}
      />
    </div>
  );
}

function KpiCard(props: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "primary" | "danger";
  highlightOn?: boolean;
}) {
  const Icon = props.icon;
  const tone = props.tone ?? "default";
  const isDangerOn = tone === "danger" && props.highlightOn;
  const valueColor =
    tone === "primary" ? "text-[#1A56DB]" : isDangerOn ? "text-red-600" : "text-slate-900";
  const iconWrapColor =
    tone === "primary"
      ? "bg-blue-50 text-[#1A56DB]"
      : isDangerOn
        ? "bg-red-50 text-red-600"
        : "bg-slate-100 text-slate-500";
  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconWrapColor}`}>
          <Icon className="h-5 w-5" />
        </span>
        {isDangerOn ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
            대기
          </span>
        ) : null}
      </div>
      <p className={`mt-3 text-2xl font-black tabular-nums ${valueColor}`}>{props.value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{props.label}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{props.sub}</p>
    </article>
  );
}

/* ───────────────── Active Orders Card List ───────────────── */

function ActiveOrdersCardList({ orders }: { orders: MentorHubOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
          <Inbox className="h-7 w-7 text-slate-300" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-bold text-slate-700">진행 중인 의뢰가 없어요</p>
        <p className="mt-1 text-xs text-slate-500">새 의뢰가 들어오면 여기에서 바로 관리할 수 있어요.</p>
        <Link
          href="/mentor/custom-request/posts"
          className="mt-4 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-[#1A56DB] hover:underline"
        >
          공개 의뢰 둘러보기 →
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
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

/* ───────────────── Quick Links 2x2 ───────────────── */

function QuickLinksGrid({ newQuestions }: { newQuestions: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <QuickLinkCard
        href="/mentor/question-room"
        icon={HelpCircle}
        title="질문방"
        desc="학생 질문 응답·노트 관리"
        badge={newQuestions > 0 ? `답변 대기 ${newQuestions}건` : null}
        iconBg="bg-blue-50"
        iconColor="text-[#1A56DB]"
      />
      <QuickLinkCard
        href="/mentor/custom-request/dashboard"
        icon={ClipboardList}
        title="맞춤의뢰"
        desc="진행 중 의뢰·납품 관리"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
      <QuickLinkCard
        href="/mentor/payouts"
        icon={Wallet}
        title="정산 / 수익"
        desc="월간 정산 내역과 지급 일정"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      />
      <QuickLinkCard
        href="/mentor/profile/edit"
        icon={UserCog}
        title="프로필 관리"
        desc="자기소개·전공·증빙서류 수정"
        iconBg="bg-slate-100"
        iconColor="text-slate-600"
      />
    </div>
  );
}

function QuickLinkCard(props: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string | null;
  iconBg: string;
  iconColor: string;
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className="group flex items-start gap-4 rounded-xl border-2 border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:p-6"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${props.iconBg} ${props.iconColor}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-bold text-slate-900 sm:text-lg">{props.title}</p>
          {props.badge ? (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-200">
              {props.badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-600">{props.desc}</p>
        <p className="mt-3 text-xs font-bold text-slate-400 group-hover:text-[#1A56DB]">바로 이동 →</p>
      </div>
    </Link>
  );
}

/* ───────────────── Revenue Summary ───────────────── */

function RevenueSummary({
  revenue,
}: {
  revenue: MentorHubDashboardData["revenuePanel"] | undefined;
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">수익 현황</h2>
          <p className="mt-1 text-xs text-slate-500">{revenue?.monthLabel ?? "이번 달"} 기준</p>
        </div>
        <Link
          href="/mentor/payouts"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#1A56DB] hover:underline"
        >
          정산 상세 보기 <span aria-hidden>→</span>
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:items-end">
        {/* Primary: 총 예상 수익 — 크게 */}
        <div className="sm:col-span-1">
          <p className="text-xs font-bold text-slate-500">총 예상 수익</p>
          <p
            className="mt-1 text-3xl font-black tabular-nums sm:text-4xl"
            style={{ color: PRIMARY }}
          >
            {formatCashKrw(revenue?.totalExpected ?? 0)}
          </p>
        </div>
        {/* Secondary: 진행 중 / 완료 — 보조 */}
        <div className="flex items-end gap-6 sm:col-span-2 sm:justify-end">
          <SecondaryAmount label="진행 중" amount={revenue?.inProgress ?? 0} />
          <div className="hidden h-10 w-px bg-slate-100 sm:block" />
          <SecondaryAmount label="완료(정산 예정)" amount={revenue?.completedPending ?? 0} />
        </div>
      </div>
    </section>
  );
}

function SecondaryAmount({ label, amount }: { label: string; amount: number }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums text-slate-900 sm:text-xl">
        {formatCashKrw(amount)}
      </p>
    </div>
  );
}
