import Link from "next/link";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { requireRole } from "@/lib/auth/routeGuard";
import { fetchAdminUsersDisplayByIds } from "@/lib/admin/adminQueries";
import { mentorProfilesAdminReadClient } from "@/lib/admin/mentorProfilesAdminRead";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

function text(row: Row, keys: string[], fallback = "—"): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function money(row: Row): string {
  const raw = row.agreed_price ?? row.price ?? row.amount ?? row.total_amount;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(n) ? `${Math.round(n).toLocaleString("ko-KR")}원` : "—";
}

function dateLabel(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function userLabel(userById: Map<string, { nickname: string | null; full_name: string | null }>, id: string): string {
  const row = userById.get(id);
  return row?.full_name?.trim() || row?.nickname?.trim() || id.slice(0, 8);
}

async function loadOrders() {
  let db = await createClient();
  try {
    // 관리자 운영 목록은 RLS로 막힐 수 있어 service_role을 우선 사용한다.
    // 이 페이지는 requireRole("admin") 아래에서만 렌더된다.
    db = createServiceRoleClient();
  } catch {
    /* session client fallback */
  }

  let query = db.from("custom_request_orders").select("*").order("created_at", { ascending: false }).limit(100);
  let { data, error } = await query;
  if (error && /column|schema cache|Could not find/i.test(error.message)) {
    const fallback = await db.from("custom_request_orders").select("*").limit(100);
    data = fallback.data;
    error = fallback.error;
  }
  return { db, rows: ((data ?? []) as Row[]), error: error?.message ?? null };
}

async function loadPostTitles(db: Awaited<ReturnType<typeof createClient>>, postIds: string[]) {
  const ids = [...new Set(postIds.filter(Boolean))];
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { data } = await db.from("custom_request_posts").select("id, title, subject").in("id", ids);
  for (const row of (data ?? []) as Row[]) {
    const id = text(row, ["id"], "");
    if (!id) continue;
    map.set(id, text(row, ["title", "subject"], id.slice(0, 8)));
  }
  return map;
}

export default async function AdminCustomRequestOrdersPage() {
  await requireRole("admin");
  const { db, rows, error } = await loadOrders();
  const postTitles = await loadPostTitles(db, rows.map((r) => text(r, ["post_id", "custom_request_post_id"], "")));

  const userIds = new Set<string>();
  for (const row of rows) {
    const studentId = text(row, ["student_id", "buyer_id", "client_id", "user_id"], "");
    const mentorId = text(row, ["mentor_id", "selected_mentor_id", "assigned_mentor_id"], "");
    if (studentId) userIds.add(studentId);
    if (mentorId) userIds.add(mentorId);
  }
  const userById = await fetchAdminUsersDisplayByIds(mentorProfilesAdminReadClient(db), [...userIds]);

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="관리자 / 맞춤의뢰"
      title="맞춤의뢰 주문 운영"
      description="맞춤의뢰 주문을 읽기 전용으로 확인합니다. 분쟁·환불·정산 처리는 기존 전용 메뉴에서 진행합니다."
      ctas={[
        { href: "/admin/disputes", label: "분쟁 관리", tone: "slate" },
        { href: "/admin/refunds", label: "환불·정산", tone: "slate" },
        { href: "/admin/dashboard", label: "대시보드", tone: "blue" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-950">
            주문 목록을 불러오지 못했습니다.
          </p>
        ) : null}
        <AdminDataTable title="최근 주문" count={rows.length}>
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">주문</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">금액</th>
                <th className="px-4 py-3">학생</th>
                <th className="px-4 py-3">멘토</th>
                <th className="px-4 py-3">생성일</th>
                <th className="px-4 py-3">연결</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    표시할 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const orderId = text(row, ["id"], "");
                  const postId = text(row, ["post_id", "custom_request_post_id"], "");
                  const studentId = text(row, ["student_id", "buyer_id", "client_id", "user_id"], "");
                  const mentorId = text(row, ["mentor_id", "selected_mentor_id", "assigned_mentor_id"], "");
                  return (
                    <tr key={orderId} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-extrabold text-slate-900">{postTitles.get(postId) ?? orderId.slice(0, 8)}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{orderId}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">{text(row, ["status", "state", "order_status"])}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-800">{money(row)}</td>
                      <td className="px-4 py-3 text-slate-700">{studentId ? userLabel(userById, studentId) : "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{mentorId ? userLabel(userById, mentorId) : "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{dateLabel(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/disputes?orderId=${encodeURIComponent(orderId)}`}
                          className="font-extrabold text-blue-700 underline underline-offset-2"
                        >
                          분쟁 보기
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </AdminDataTable>
      </div>
    </PageScaffold>
  );
}
