import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";
import type { UserRow } from "@/lib/types/user";

/** PageScaffold 하단 연결 포인트 목록 */
export const MYPAGE_DATA_MODEL = [
  "users (프로필 요약)",
  "mentor_student_rooms (질문방 CTA, 연결됨/개수 — 질문방 라우트·스레드 쿼리는 변경 없음)",
  "subscriptions (구독 개수, 스키마에 user FK 필요)",
  "payments (결제·영수 관련, /wallet /cash-history 와 연계 예정)",
  "notifications (알림, 목록 UI·읽음 처리는 후속)",
  "reviews, reports (또는 후보명) — 본 턴은 count probe 또는 unavailable",
] as const;

export type MypageMetric = {
  /** empty면 조회는 됐으나 0건, skeleton이면 스키마/권한/칼럼 이슈 */
  label: string;
  valueText: string;
  status: "connected" | "empty" | "skeleton";
  detail: string;
};

type CountResult = { n: number; error: null } | { n: null; error: string };

async function countRowsForUser(
  supabase: SupabaseClient,
  table: string,
  userId: string
): Promise<CountResult> {
  let relErr: string | null = null;

  const fkCandidates = [
    "user_id",
    "student_id",
    "subscriber_id",
    "owner_id",
    "recipient_id",
    "reporter_id",
    "author_id",
  ] as const;

  for (const col of fkCandidates) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(col, userId);
    if (!error && count !== null) {
      return { n: count, error: null };
    }
    if (error) {
      if (/relation|does not exist|not find/i.test(error.message)) {
        return { n: null, error: error.message };
      }
      if (/column|schema cache/i.test(error.message)) {
        continue;
      }
      if (/row-level security|permission denied|RLS/i.test(error.message)) {
        return { n: null, error: error.message };
      }
      relErr = error.message;
    }
  }
  return { n: null, error: relErr ?? "user를 가리키는 FK 컬럼을 아직 식별하지 못했습니다(스키마 확정 후). " };
}

function toMetric(
  table: string,
  label: string,
  r: CountResult
): { metric: MypageMetric; connected: boolean } {
  if (r.error) {
    return {
      connected: false,
      metric: {
        label,
        valueText: "—",
        status: "skeleton",
        detail: `${table}: ${r.error}`,
      },
    };
  }
  return {
    connected: true,
    metric: {
      label,
      valueText: String(r.n),
      status: r.n === 0 ? "empty" : "connected",
      detail: r.n === 0 ? `${table}에서 해당 사용자 0건` : `${table} count`,
    },
  };
}

type ScaffoldRow = { title: string; body: string; status: "skeleton" | "connected" };

export type StudentMypageBundle = {
  profile: UserRow | null;
  profileError: string | null;
  roomCount: { n: number; error: string | null };
  subscriptions: MypageMetric;
  payments: MypageMetric;
  notifications: MypageMetric;
  reviews: MypageMetric;
  reports: MypageMetric;
  scaffoldSummary: ScaffoldRow[];
};

/**
 * 캐시/커뮤니티 모듈을 수정하지 않고, 마이페이지 전용 count probe만 수행
 */
export async function loadStudentMypageBundle(
  supabase: SupabaseClient,
  userId: string,
  profile: UserRow | null,
  profileError: string | null
): Promise<StudentMypageBundle> {
  const { rows, error: roomErr } = await fetchRoomsForUser(supabase, "student", userId);
  const roomCount = { n: roomErr ? 0 : rows.length, error: roomErr };

  const s = toMetric("subscriptions", "구독(행 수)", await countRowsForUser(supabase, "subscriptions", userId));
  const p = toMetric("payments", "결제(행 수)", await countRowsForUser(supabase, "payments", userId));
  const n = toMetric("notifications", "알림(행 수)", await countRowsForUser(supabase, "notifications", userId));

  let reviewsMetric: MypageMetric;
  const rev = await countRowsForUser(supabase, "reviews", userId);
  if (rev.error) {
    const alt = await countRowsForUser(supabase, "mentor_reviews", userId);
    const t = toMetric("mentor_reviews", "리뷰(행 수, 후보명)", alt);
    reviewsMetric = t.metric;
  } else {
    reviewsMetric = toMetric("reviews", "리뷰(행 수)", rev).metric;
  }

  let reportsMetric: MypageMetric;
  const rep = await countRowsForUser(supabase, "reports", userId);
  if (rep.error) {
    const t = toMetric("abuse_reports", "신고(행 수, 후보명)", await countRowsForUser(supabase, "abuse_reports", userId));
    reportsMetric = t.metric;
  } else {
    reportsMetric = toMetric("reports", "신고(행 수)", rep).metric;
  }

  const subsConn = s.connected;
  const payConn = p.connected;
  const notifConn = n.connected;

  const scaff: ScaffoldRow[] = [
    {
      title: "users 프로필",
      body: profile
        ? `닉/이름/역할: ${profile.nickname ?? profile.full_name ?? "—"} (${profile.role})`
        : (profileError ?? "프로필 행이 없습니다. public.users sync 확인."),
      status: profile ? "connected" : "skeleton",
    },
    {
      title: "질문방(방 목록)",
      body: roomCount.error
        ? `mentor_student_rooms: ${roomCount.error}`
        : `활성 방 ${roomCount.n}개(목록/스레드는 /question-room 유지).`,
      status: roomCount.error ? "skeleton" : "connected",
    },
    {
      title: "구독 subscriptions",
      body: s.metric.detail,
      status: subsConn ? "connected" : "skeleton",
    },
    {
      title: "결제 payments",
      body: p.metric.detail,
      status: payConn ? "connected" : "skeleton",
    },
    {
      title: "알림 notifications",
      body: n.metric.detail,
      status: notifConn ? "connected" : "skeleton",
    },
    {
      title: "리뷰·신고(선택)",
      body: "reviews / reports — 스키마 확정 후 CTA·상세 라우트 연동.",
      status: "skeleton",
    },
  ];

  return {
    profile,
    profileError: profile ? null : (profileError ?? "프로필이 없습니다."),
    roomCount,
    subscriptions: s.metric,
    payments: p.metric,
    notifications: n.metric,
    reviews: reviewsMetric,
    reports: reportsMetric,
    scaffoldSummary: scaff,
  };
}
