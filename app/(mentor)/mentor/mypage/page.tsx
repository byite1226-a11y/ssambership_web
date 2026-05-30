import Link from "next/link";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRIMARY = "#1A56DB";

type ReviewRow = { rating?: unknown };
type SettlementRow = { mentor_amount?: unknown };

function pickNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function formatKrw(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(Math.max(0, Math.round(value)))}원`;
}

function verificationLabel(status: string | null): { label: string; tone: "ok" | "pending" | "none" } {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "approved" || s === "verified") return { label: "인증 완료", tone: "ok" };
  if (s === "pending" || s === "in_review" || s === "submitted") return { label: "인증 검토중", tone: "pending" };
  if (s === "rejected") return { label: "인증 반려", tone: "none" };
  return { label: "미인증", tone: "none" };
}

/**
 * 멘토 마이페이지 — 프로필 요약 + 이번 달 수익 + 빠른 이동 카드.
 * 정산/리뷰 등 상세는 각 도메인 페이지로 위임.
 */
export default async function MentorMypagePage() {
  const { user, profile } = await requireRole("mentor");
  const supabase = await createClient();

  // 인증 상태 (mentor_profiles)
  let verificationStatus: string | null = null;
  try {
    const { data, error } = await supabase
      .from("mentor_profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) {
      const v = (data as { verification_status?: unknown }).verification_status;
      verificationStatus = typeof v === "string" ? v : null;
    }
  } catch {
    /* RLS·스키마 차이 → 미인증 표시 폴백 */
  }

  // 평점/리뷰 개수 (reviews)
  let ratingAvg: number | null = null;
  let reviewCount = 0;
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("mentor_id", user.id);
    if (!error && Array.isArray(data) && data.length > 0) {
      const rows = data as ReviewRow[];
      const sum = rows.reduce((s, r) => s + pickNumber(r.rating), 0);
      ratingAvg = sum / rows.length;
      reviewCount = rows.length;
    }
  } catch {
    /* */
  }

  // 이번 달 맞춤의뢰 정산 예정 합계 (custom_order_settlement_items)
  let monthEarnings = 0;
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("custom_order_settlement_items")
      .select("mentor_amount")
      .eq("mentor_id", user.id)
      .gte("created_at", monthStart.toISOString());
    if (!error && Array.isArray(data)) {
      const rows = data as SettlementRow[];
      monthEarnings = rows.reduce((s, r) => s + pickNumber(r.mentor_amount), 0);
    }
  } catch {
    /* */
  }

  const displayName =
    profile?.nickname?.trim() ||
    profile?.full_name?.trim() ||
    "멘토";

  const verification = verificationLabel(verificationStatus);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      {/* 헤더: 프로필 요약 */}
      <header className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-500">멘토 마이페이지</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{displayName}님</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
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
      </header>

      {/* 이번 달 수익 요약 */}
      <section className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900 sm:text-xl">이번 달 수익(예상)</h2>
          <Link
            href="/mentor/payouts"
            className="text-sm font-bold underline underline-offset-2"
            style={{ color: PRIMARY }}
          >
            정산 상세 보기 →
          </Link>
        </div>
        <p className="mt-3 text-3xl font-black sm:text-4xl" style={{ color: PRIMARY }}>
          {formatKrw(monthEarnings)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          맞춤의뢰 정산 예정(월간). 구독 정산은 정산 상세에서 확인하세요.
        </p>
      </section>

      {/* 빠른 이동 카드 */}
      <section>
        <h2 className="text-lg font-black text-slate-900 sm:text-xl">빠른 이동</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <QuickCard href="/mentor/profile/edit" title="프로필 관리" desc="자기소개·전공·증빙서류 수정" />
          <QuickCard href="/mentor/payouts" title="정산 / 수익" desc="월간 정산 내역과 지급 일정" />
          <QuickCard href="/mentor/question-room" title="질문방" desc="학생 질문 응답·노트 관리" />
          <QuickCard href="/mentor/custom-request/dashboard" title="맞춤의뢰" desc="진행 중 의뢰·납품 관리" />
        </div>
      </section>
    </main>
  );
}

function QuickCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#1A56DB] hover:shadow-md sm:p-6"
    >
      <p className="text-base font-black sm:text-lg" style={{ color: PRIMARY }}>
        {title}
      </p>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
      <p className="mt-3 text-xs font-bold text-slate-400 group-hover:text-slate-600">바로 이동 →</p>
    </Link>
  );
}
