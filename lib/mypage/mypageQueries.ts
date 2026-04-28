import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRoomsForUser } from "@/lib/qna/questionRoomQueries";
import type { UserRow } from "@/lib/types/user";

/** PageScaffold 하단 연결 포인트 목록 */
export const MYPAGE_DATA_MODEL = [
  "프로필",
  "질문방 안내·바로가기",
  "구독 건수",
  "결제·주문 건수",
  "알림 건수",
  "리뷰·신고(준비 중)",
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
  return { n: null, error: relErr ?? "일시적으로 건수를 가져올 수 없어요" };
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
        detail: "잠시 후 다시 시도하거나, 문제가 계속되면 고객센터로 문의해 주세요",
      },
    };
  }
  return {
    connected: true,
    metric: {
      label,
      valueText: String(r.n),
      status: r.n === 0 ? "empty" : "connected",
      detail: r.n === 0 ? "해당 항목이 아직 없어요" : `총 ${r.n}건이에요`,
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

  const s = toMetric("subscriptions", "구독", await countRowsForUser(supabase, "subscriptions", userId));
  const p = toMetric("payments", "결제", await countRowsForUser(supabase, "payments", userId));
  const n = toMetric("notifications", "알림", await countRowsForUser(supabase, "notifications", userId));

  let reviewsMetric: MypageMetric;
  const rev = await countRowsForUser(supabase, "reviews", userId);
  if (rev.error) {
    const alt = await countRowsForUser(supabase, "mentor_reviews", userId);
    const t = toMetric("mentor_reviews", "리뷰", alt);
    reviewsMetric = t.metric;
  } else {
    reviewsMetric = toMetric("reviews", "리뷰", rev).metric;
  }

  let reportsMetric: MypageMetric;
  const rep = await countRowsForUser(supabase, "reports", userId);
  if (rep.error) {
    const t = toMetric("abuse_reports", "신고", await countRowsForUser(supabase, "abuse_reports", userId));
    reportsMetric = t.metric;
  } else {
    reportsMetric = toMetric("reports", "신고", rep).metric;
  }

  const subsConn = s.connected;
  const payConn = p.connected;
  const notifConn = n.connected;

  const scaff: ScaffoldRow[] = [
    {
      title: "프로필",
      body: profile
        ? `닉네임·이름: ${profile.nickname ?? profile.full_name ?? "—"} (${profile.role})`
        : (profileError ?? "프로필을 불러오지 못했어요."),
      status: profile ? "connected" : "skeleton",
    },
    {
      title: "질문방",
      body: roomCount.error
        ? "질문방 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
        : `사용 중인 질문방 ${roomCount.n}곳이에요.`,
      status: roomCount.error ? "skeleton" : "connected",
    },
    {
      title: "구독",
      body: s.metric.detail,
      status: subsConn ? "connected" : "skeleton",
    },
    {
      title: "결제",
      body: p.metric.detail,
      status: payConn ? "connected" : "skeleton",
    },
    {
      title: "알림",
      body: n.metric.detail,
      status: notifConn ? "connected" : "skeleton",
    },
    {
      title: "리뷰·신고",
      body: "이용 내역이 생기면 이곳에서 확인하실 수 있어요.",
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
