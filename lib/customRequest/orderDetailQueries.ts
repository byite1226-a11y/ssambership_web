import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchMentorProfileForPublicMentor, getMentorUserPublic } from "@/lib/auth/mentorPublicRead";
import { buildMentorProfileDisplay, type MentorProfileDisplay } from "@/lib/mentor/mentorDisplayFields";
import {
  type CustomListResult,
  loadApplicationById,
  loadCustomPostById,
  loadOrderBundle,
  ORDER_TO_DELIVERABLE_FK_CANDIDATES,
  pickDisplayField,
  pickMentorIdFromApplication,
} from "@/lib/customRequest/customRequestQueries";
import { hasActiveDisputeForOrderRows } from "@/lib/customRequest/orderDisputeHelpers";
import { loadCustomOrderSettlementItemByOrderId } from "@/lib/customRequest/orderSettlementService";
import { loadOrderMessages, loadOrderRevisions } from "@/lib/customRequest/orderRoomMutations";
import { pickExistingColumn } from "@/lib/qna/safeSelect";
import {
  formatOrderRoomDate,
  orderStatusLabelForUi,
  paymentStatusLabelForUi,
  studentCanDownloadDeliverable,
} from "@/lib/customRequest/orderLifecycleConstants";

type Row = Record<string, unknown>;

function pickPostIdFromOrderRow(r: Row | null): string | null {
  if (!r) return null;
  for (const k of ["post_id", "custom_request_post_id", "request_id", "custom_request_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickPostIdFromApplicationRow(r: Row | null): string | null {
  if (!r) return null;
  for (const k of ["post_id", "request_id", "custom_request_id", "custom_request_post_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickApplicationIdFromOrderRow(r: Row | null): string | null {
  if (!r) return null;
  for (const k of ["application_id", "custom_request_application_id", "selected_application_id", "bid_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

export function pickMentorIdFromOrderRow(r: Row | null): string | null {
  if (!r) return null;
  for (const k of [
    "mentor_id",
    "selected_mentor_id",
    "assigned_mentor_id",
    "expert_id",
    "mentor_user_id",
  ] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/**
 * order_events / custom_order_events 등 — 주문 진행 로그(있으면).
 */
export async function loadOrderEventLog(
  supabase: SupabaseClient,
  orderId: string
): Promise<CustomListResult> {
  const candidates = [
    "order_events",
    "custom_order_events",
    "request_order_status_events",
    "order_status_history",
  ] as const;
  for (const table of candidates) {
    const { error: pe } = await supabase.from(table).select("id").limit(1);
    if (pe) continue;
    const { column: fk } = await pickExistingColumn(supabase, table, [...ORDER_TO_DELIVERABLE_FK_CANDIDATES]);
    if (!fk) continue;
    const o1 = await supabase
      .from(table)
      .select("*")
      .eq(fk, orderId)
      .order("created_at", { ascending: true });
    if (o1.error) {
      const o2 = await supabase.from(table).select("*").eq(fk, orderId);
      if (o2.error) {
        return { table, sourceNote: "진행 기록을 불러오지 못했습니다.", rows: [], error: o2.error.message };
      }
      return {
        table,
        sourceNote: "최신 순으로 정리한 진행 기록",
        rows: (o2.data as Row[]) ?? [],
        error: null,
      };
    }
    return {
      table,
      sourceNote: "진행 기록",
      rows: (o1.data as Row[]) ?? [],
      error: null,
    };
  }
  return {
    table: null,
    sourceNote: "이 주문에 대한 단계별 기록이 별도로 없을 수 있습니다. 아래 요약·메시지를 참고하세요.",
    rows: [],
    error: null,
  };
}

export type OrderDetailPageData = {
  bundle: Awaited<ReturnType<typeof loadOrderBundle>>;
  post: Awaited<ReturnType<typeof loadCustomPostById>>;
  application: Awaited<ReturnType<typeof loadApplicationById>>;
  mentorDisplay: MentorProfileDisplay | null;
  events: CustomListResult;
  /** 주문/지원/포스트로부터 뽑은 요약(헤더) */
  header: {
    requestTitle: string;
    category: string;
    subjectLine: string;
    mentorName: string;
    university: string;
    department: string;
    subjects: string;
    priceLine: string;
    dueLine: string;
    statusLine: string;
    paymentLine: string;
  };
  latestDeliverable: Row | null;
  /** 주문방 thread 메시지(스키마 있을 때) */
  messages: CustomListResult;
  /** 학생 수정 요청(custom_order_revisions, 스키마 있을 때) */
  revisions: CustomListResult;
  /** 맞춤의뢰 정산 예정 1행(스키마·RLS에 따름) */
  settlementItem: Row | null;
  settlementLoadError: string | null;
  hasActiveDispute: boolean;
};

const DELIVERABLE_STORAGE_PATH_KEYS = [
  "storage_path",
  "file_path",
  "file_storage_path",
  "object_path",
  "file_url",
] as const;

function stripDeliverableStoragePathFields(row: Row): Row {
  const clean = { ...row };
  for (const key of DELIVERABLE_STORAGE_PATH_KEYS) {
    delete clean[key];
  }
  return clean;
}

export function hideStudentPreCompletionDeliverableStoragePaths(detail: OrderDetailPageData): OrderDetailPageData {
  if (studentCanDownloadDeliverable(detail.bundle.order.row)) {
    return detail;
  }
  const rows = ((detail.bundle.deliverables.rows as Row[] | undefined) ?? []).map(stripDeliverableStoragePathFields);
  const latestDeliverable = detail.latestDeliverable
    ? stripDeliverableStoragePathFields(detail.latestDeliverable as Row)
    : null;
  return {
    ...detail,
    bundle: {
      ...detail.bundle,
      deliverables: {
        ...detail.bundle.deliverables,
        rows,
      },
    },
    latestDeliverable,
  };
}

function numberish(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim()) return v;
  return "";
}

function buildHeader(
  order: Row | null,
  post: Row | null,
  app: Row | null,
  display: MentorProfileDisplay | null
): OrderDetailPageData["header"] {
  const requestTitle = post
    ? pickDisplayField(post, ["title", "subject", "goal"])
    : order
      ? pickDisplayField(order, ["title", "label"])
      : "—";
  const category = post
    ? pickDisplayField(post, ["category", "subcategory", "category_label"])
    : pickDisplayField(order ?? {}, ["category"]);
  const subjectLine = post
    ? pickDisplayField(post, ["subject", "topic", "goal"])
    : app
      ? pickDisplayField(app, ["subject", "title"])
      : "—";
  const mentorName = display?.displayName?.trim() ? display.displayName : "—";
  return {
    requestTitle,
    category,
    subjectLine,
    mentorName,
    university: display?.university || pickDisplayField(app ?? {}, ["school", "university", "university_name"]),
    department: display?.department || pickDisplayField(app ?? {}, ["major", "department", "field"]),
    subjects: display?.subjects || "—",
    priceLine: (() => {
      for (const k of ["agreed_price", "proposed_price", "price", "amount"] as const) {
        for (const src of [order, app] as (Row | null)[]) {
          if (!src) continue;
          const raw = (src as Row)[k];
          if (raw == null) continue;
          if (typeof raw === "number" && Number.isFinite(raw)) {
            return `${raw.toLocaleString("ko-KR")}원`;
          }
          const s = numberish(raw);
          if (s) {
            const n = Number(String(s).replace(/[, ]/g, ""));
            if (Number.isFinite(n)) {
              return `${n.toLocaleString("ko-KR")}원`;
            }
            return s;
          }
        }
      }
      return "—";
    })(),
    dueLine: (() => {
      for (const src of [app, order] as (Row | null)[]) {
        if (!src) continue;
        for (const k of ["proposed_due", "delivery_at", "deliver_by", "due_at", "deadline"] as const) {
          const v = (src as Row)[k];
          if (v == null) continue;
          const f = formatOrderRoomDate(v);
          if (f !== "—") {
            return f;
          }
        }
      }
      return "—";
    })(),
    statusLine: (() => {
      if (!order) {
        return "—";
      }
      const raw = pickDisplayField(order, ["status", "state", "order_status", "stage"]);
      if (raw === "—") {
        return "—";
      }
      return orderStatusLabelForUi(raw);
    })(),
    paymentLine: (() => {
      if (!order) {
        return "—";
      }
      const raw = pickDisplayField(order, ["payment_status", "paymentState", "pay_status"]);
      if (raw === "—") {
        return "—";
      }
      return paymentStatusLabelForUi(raw);
    })(),
  };
}

type BundleT = Awaited<ReturnType<typeof loadOrderBundle>>;

/**
 * W19 주문방: 주문 + 의뢰/지원(가능 시) + 멘토 프로필 + 이벤트 로그.
 * @param preloaded - 접근 검사 후 `loadOrderBundle` 결과를 넘기면 이중 조회를 생략
 */
export async function loadOrderDetailPageData(
  supabase: SupabaseClient,
  orderId: string,
  preloaded?: BundleT
): Promise<OrderDetailPageData> {
  const bundle = preloaded ?? (await loadOrderBundle(supabase, orderId));
  const o = bundle.order.row;

  if (!o) {
    return {
      bundle,
      post: { row: null, table: null, error: null },
      application: { row: null, table: null, error: null },
      mentorDisplay: null,
      events: { table: null, sourceNote: "주문 없음", rows: [], error: null },
      header: buildHeader(null, null, null, null),
      latestDeliverable: null,
      messages: { table: null, sourceNote: "주문 없음", rows: [], error: null },
      revisions: { table: null, sourceNote: "주문 없음", rows: [], error: null },
      settlementItem: null,
      settlementLoadError: null,
      hasActiveDispute: false,
    };
  }

  const appId = pickApplicationIdFromOrderRow(o);
  let postId = pickPostIdFromOrderRow(o);
  let mid = pickMentorIdFromOrderRow(o);

  const application = appId
    ? await loadApplicationById(supabase, appId)
    : { row: null, table: null, error: null as string | null };
  if (!postId && application.row) {
    postId = pickPostIdFromApplicationRow(application.row);
  }
  if (!mid && application.row) {
    const fromApp = pickMentorIdFromApplication(application.row);
    if (fromApp) mid = fromApp;
  }

  const post = postId
    ? await loadCustomPostById(supabase, postId)
    : { row: null, table: null, error: null as string | null };

  let mentorDisplay: MentorProfileDisplay | null = null;
  if (mid) {
    const [mp, { data: urow }] = await Promise.all([
      fetchMentorProfileForPublicMentor(supabase, mid),
      getMentorUserPublic(supabase, mid),
    ]);
    if (!mp.error) {
      mentorDisplay = buildMentorProfileDisplay(mp.row, urow);
    }
  }

  const [events, messages, revisions, settlementRes] = await Promise.all([
    loadOrderEventLog(supabase, orderId),
    loadOrderMessages(supabase, orderId),
    loadOrderRevisions(supabase, orderId),
    loadCustomOrderSettlementItemByOrderId(supabase, orderId),
  ]);
  const delRows = (bundle.deliverables.rows as Row[]) ?? [];
  /** loadOrderBundle에서 version desc 등으로 정렬됨 */
  const latestDeliverable = delRows[0] ?? null;
  const hasActiveDispute = hasActiveDisputeForOrderRows(bundle.disputes.rows);

  const headerBase = buildHeader(o, post.row, application.row, mentorDisplay);
  const header = hasActiveDispute
    ? { ...headerBase, statusLine: "분쟁 접수 · 운영 검토 중" }
    : headerBase;

  return {
    bundle,
    post,
    application,
    mentorDisplay,
    events,
    header,
    latestDeliverable,
    messages,
    revisions,
    settlementItem: settlementRes.row,
    settlementLoadError: settlementRes.error,
    hasActiveDispute,
  };
}
