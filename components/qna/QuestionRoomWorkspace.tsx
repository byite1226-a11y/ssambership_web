import Link from "next/link";
import type { ReactNode } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import {
  createQuestionThreadAction,
  saveConnectionNoteAction,
  sendQuestionMessageAction,
} from "@/lib/qna/questionRoomActions";

type Row = Record<string, unknown>;

function Panel({
  title,
  tone,
  className = "",
  children,
}: {
  title: string;
  tone: "blue" | "green" | "slate";
  className?: string;
  children: ReactNode;
}) {
  const border =
    tone === "blue"
      ? "border-blue-200"
      : tone === "green"
        ? "border-emerald-200"
        : "border-slate-200";
  return (
    <section
      className={`rounded-2xl border ${border} bg-white p-4 shadow-sm sm:p-5 ${className}`.trim()}
    >
      <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** 쿼리/서버 오류 문자열이 기술·JSON·PGRST 를 포함하면 UI에 짧은 안내만 쓴다. */
function publicQnaPanelError(
  which: "rooms" | "threads" | "messages" | "notes",
  raw: string | null | undefined
): string {
  const fallbacks = {
    rooms: "질문방을 불러오는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.",
    threads: "질문 주제를 불러오는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.",
    messages: "대화를 불러오는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.",
    notes: "연결 메모를 불러오는 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.",
  } as const;
  const fallback = fallbacks[which];
  if (raw == null) return fallback;
  const t = String(raw).trim();
  if (!t) return fallback;
  if (
    /PGRST|postgrest|https?:\/\/|\"(hint|code|details)\"|schema cache|\"error\"|jsonb?|error\":|42P0|22P0|23\d{3}/i.test(
      t
    ) ||
    t.length > 500
  ) {
    return fallback;
  }
  return t;
}

function StateBanner({ kind, message }: { kind: "loading" | "error" | "empty"; message: string }) {
  const skin =
    kind === "loading"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : kind === "error"
        ? "border-red-200 bg-red-50 text-red-950"
        : "border-slate-200 bg-slate-50 text-slate-800";
  return <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${skin}`}>{message}</div>;
}

function pickRowString(r: Row | undefined, keys: string[]): string | null {
  if (!r) return null;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function formatDateTime(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function roomLabelForRow(r: Row): string {
  return pickRowString(r, ["title", "topic", "name", "label"]) ?? "질문방";
}

function threadLabelForRow(t: Row): string {
  return pickRowString(t, ["title", "subject", "label"]) ?? "새 질문";
}

function messageBody(m: Row): string {
  return (
    (typeof m.body === "string" && m.body) ||
    (typeof m.content === "string" && m.content) ||
    (typeof m.text === "string" && m.text) ||
    ""
  );
}

function messageAuthorId(m: Row): string | null {
  for (const k of ["author_id", "user_id", "sender_id"] as const) {
    const v = m[k];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

function feedbackStrip(props: {
  ok?: string | null;
  error?: string | null;
}) {
  if (!props.ok && !props.error) return null;
  return (
    <div className="space-y-2">
      {props.ok ? <StateBanner kind="empty" message={props.ok} /> : null}
      {props.error ? <StateBanner kind="error" message={props.error} /> : null}
    </div>
  );
}

function quickLinkItem(href: string, label: string) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
    >
      {label}
    </Link>
  );
}

export function QuestionRoomWorkspace(props: {
  variant: "student" | "mentor";
  /** 목록 라우트에서는 room만 채우고, thread/message/notes는 상세로 유도 */
  surface?: "list" | "detail";
  actionFeedback?: { kind?: "thread" | "message" | "note"; ok: string | null; error: string | null };
  title: string;
  subtitle: string;
  /** 상세: author_id 기준 말풍선 정렬 */
  currentUserId?: string;
  rooms: { rows: Row[]; error: string | null; loading: boolean };
  threads: { rows: Row[]; error: string | null; loading: boolean };
  messages: { rows: Row[]; error: string | null; loading: boolean };
  notes: { rows: Row[]; error: string | null; loading: boolean };
  /** room detail 페이지에서만 사용 */
  roomId?: string;
  threadId?: string | null;
  /** 목록 페이지에서 rooms → 첫 room 상세로 이동하는 용도 */
  buildRoomHref?: (roomId: string) => string;
  buildThreadHref?: (roomId: string, threadId: string) => string;
  initialNoteText?: string;
  /** 액션 실패 후 searchParams로 복원한 초안(성공 시 비움) */
  draftThreadTitle?: string;
  draftMessageBody?: string;
  draftNoteBody?: string;
  /** redirect마다 바뀌는 nonce — 폼 remount로 defaultValue 반영 */
  formRevision?: string;
}) {
  const tone: "blue" | "green" = props.variant === "student" ? "blue" : "green";
  const surface = props.surface ?? "detail";
  const rev = props.formRevision ?? "0";
  const uid = props.currentUserId;

  const listEmptyRoomMsg =
    props.variant === "student"
      ? "아직 연결된 질문방이 없습니다. 멘토 구독 후 질문방이 열립니다."
      : "아직 연결된 학생 질문방이 없습니다.";

  const threadEmptyMsg =
    props.variant === "student"
      ? "아직 질문이 없습니다. 첫 질문을 남겨 보세요."
      : "아직 답변할 질문이 없습니다.";

  const currentRoom =
    surface === "detail" && props.roomId
      ? props.rooms.rows.find((r) => r != null && String(r.id) === String(props.roomId))
      : undefined;
  const detailContextTitle = currentRoom ? roomLabelForRow(currentRoom) : props.title;
  const detailContextSubtitle =
    surface === "detail"
      ? props.variant === "student"
        ? "멘토와 궁금한 점을 주고받는 공간입니다."
        : "이 학생의 질문에 답하고 안내를 이어가세요."
      : props.subtitle;

  const roomList = (
    <ul className="mt-3 space-y-2">
      {props.rooms.rows.map((r) => {
        const id = (r.id as string | undefined) ?? "";
        const label = roomLabelForRow(r);
        const active = props.roomId && id && props.roomId === id;
        return (
          <li key={id || "room"}>
            {props.buildRoomHref && id ? (
              <Link
                href={props.buildRoomHref(id)}
                className={[
                  "block rounded-2xl border px-3 py-3 text-sm font-bold shadow-sm",
                  active
                    ? tone === "blue"
                      ? "border-blue-300 bg-blue-50 text-blue-950"
                      : "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300",
                ].join(" ")}
              >
                {label}
              </Link>
            ) : (
              <div className="block rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 shadow-sm">
                {label}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const threadListBlock = (
    <>
      {props.threads.loading ? <StateBanner kind="loading" message="목록을 불러오는 중…" /> : null}
      {!props.threads.loading && props.threads.error ? (
        <StateBanner kind="error" message={publicQnaPanelError("threads", props.threads.error)} />
      ) : null}
      {!props.threads.loading && !props.threads.error && props.threads.rows.length === 0 ? (
        <StateBanner kind="empty" message={threadEmptyMsg} />
      ) : null}
      <ul className="mt-3 space-y-2">
        {props.threads.rows.map((t) => {
          const id = (t.id as string | undefined) ?? "";
          const label = threadLabelForRow(t);
          const recent = formatDateTime(t.updated_at) ?? formatDateTime(t.created_at) ?? null;
          const active = props.threadId && id && props.threadId === id;
          return (
            <li key={id || "thread"}>
              {props.roomId && props.buildThreadHref && id ? (
                <Link
                  href={props.buildThreadHref(props.roomId, id)}
                  className={[
                    "block rounded-2xl border px-3 py-3 text-left text-sm font-bold shadow-sm",
                    active
                      ? "border-slate-500 bg-slate-100 text-slate-950"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300",
                  ].join(" ")}
                >
                  <span className="line-clamp-2">{label}</span>
                  {recent ? <p className="mt-1 text-xs font-medium text-slate-500">{recent}</p> : null}
                </Link>
              ) : (
                <div className="block rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 shadow-sm">
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  const newThreadForm =
    surface === "detail" ? (
      <form
        key={`thread-form-${rev}`}
        action={createQuestionThreadAction}
        className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        {props.actionFeedback?.kind === "thread" && props.actionFeedback.error ? (
          <div className="mb-2">
            <StateBanner kind="error" message={props.actionFeedback.error} />
          </div>
        ) : null}
        <p className="text-xs font-extrabold text-slate-700">새 질문 주제</p>
        <input
          name="threadTitle"
          required
          defaultValue={props.draftThreadTitle ?? ""}
          placeholder="무엇에 대해 이야기할지 짧게 적어 주세요."
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        {props.roomId ? <input type="hidden" name="roomId" value={props.roomId} /> : null}
        <input type="hidden" name="actor" value={props.variant} />
        <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
        <FormSubmitButton
          idleLabel="질문 주제 추가"
          pendingLabel="추가 중…"
          className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
        />
      </form>
    ) : null;

  const messagesList = (
    <div className="flex flex-col gap-3 pr-0.5">
      {props.messages.rows.map((m) => {
        const body = messageBody(m);
        const author = messageAuthorId(m);
        const mine = Boolean(uid && author && author === uid);
        const who = mine
          ? "나"
          : props.variant === "student"
            ? "멘토"
            : "학생";
        const bubble = mine
          ? tone === "blue"
            ? "rounded-2xl bg-blue-600 text-white"
            : "rounded-2xl bg-emerald-600 text-white"
          : "rounded-2xl bg-slate-100 text-slate-900";
        const sent = formatDateTime(m.created_at) ?? formatDateTime(m.sent_at) ?? null;
        return (
          <div
            key={(m.id as string | undefined) || "msg"}
            className={["flex w-full max-w-full flex-col", mine ? "items-end" : "items-start"].join(" ")}
          >
            <div className="mb-0.5 flex max-w-[min(100%,24rem)] flex-col items-baseline gap-0.5 sm:max-w-[min(100%,28rem)]">
              <p
                className={[
                  "px-0.5 text-xs font-bold",
                  mine ? (tone === "blue" ? "text-blue-800" : "text-emerald-800") : "text-slate-600",
                ].join(" ")}
              >
                {who}
                {sent ? <span className="ml-1.5 font-medium text-slate-500">· {sent}</span> : null}
              </p>
              <div className={["px-3 py-2.5 text-sm leading-relaxed shadow-sm", bubble].join(" ")}>
                <p className="whitespace-pre-wrap break-words font-medium">
                  {body ? body : "내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const messageFormBlock =
    surface === "detail" ? (
      <form
        key={`msg-${props.threadId ?? "none"}-${rev}-${props.draftMessageBody?.length ?? 0}`}
        action={sendQuestionMessageAction}
        className="mt-0 rounded-xl border-0 border-t border-slate-200 bg-slate-50/95 p-3 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
      >
        {props.actionFeedback?.kind === "message" && props.actionFeedback.error ? (
          <div className="mb-2">
            <StateBanner kind="error" message={props.actionFeedback.error} />
          </div>
        ) : null}
        <p className="text-xs font-extrabold text-slate-700">메시지</p>
        <textarea
          name="messageBody"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
          rows={4}
          required
          defaultValue={props.draftMessageBody ?? ""}
          placeholder={
            props.threadId
              ? props.variant === "student"
                ? "궁금한 점을 구체적으로 적어 주세요."
                : "학생이 이해하기 쉽게 답변을 작성해 주세요."
              : "질문 주제를 먼저 선택한 뒤 작성해 주세요."
          }
          disabled={!props.threadId}
        />
        {props.threadId ? <input type="hidden" name="threadId" value={props.threadId} /> : null}
        {props.roomId ? <input type="hidden" name="roomId" value={props.roomId} /> : null}
        <input type="hidden" name="actor" value={props.variant} />
        <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
        <FormSubmitButton
          idleLabel={props.variant === "student" ? "보내기" : "답장 보내기"}
          pendingLabel={props.variant === "student" ? "보내는 중…" : "답장 전송 중…"}
          disabled={!props.threadId}
          className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        />
      </form>
    ) : null;

  const connectionNotesBlock = (
    <>
      <h2 className="text-sm font-extrabold text-slate-900">멘토 연결 메모</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        {props.variant === "student"
          ? "멘토가 학습 흐름을 참고하기 위해 남긴 메모입니다."
          : "이 학생에게 이어서 안내할 내용을 메모해 두세요."}
      </p>
      {props.notes.loading ? (
        <div className="mt-3">
          <StateBanner kind="loading" message="메모를 불러오는 중…" />
        </div>
      ) : null}
      {!props.notes.loading && props.notes.error ? (
        <div className="mt-3">
          <StateBanner kind="error" message={publicQnaPanelError("notes", props.notes.error)} />
        </div>
      ) : null}
      {!props.notes.loading && !props.notes.error && props.notes.rows.length === 0 ? (
        <div className="mt-3">
          <StateBanner kind="empty" message="저장된 메모가 없습니다. 아래에서 남길 수 있어요." />
        </div>
      ) : null}
      <div className="mt-3 space-y-2">
        {props.notes.rows.map((n) => {
          const noteText =
            (typeof n.body === "string" && n.body) ||
            (typeof n.content === "string" && n.content) ||
            (typeof n.text === "string" && n.text) ||
            (typeof n.note === "string" && n.note) ||
            "";
          return (
            <div
              key={(n.id as string | undefined) || "note"}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-800 shadow-sm"
            >
              <p className="whitespace-pre-wrap break-words">{noteText || "작성된 내용이 없습니다."}</p>
            </div>
          );
        })}
      </div>
      {surface === "detail" ? (
        <form
          key={`note-form-${rev}`}
          action={saveConnectionNoteAction}
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
        >
          {props.actionFeedback?.kind === "note" && props.actionFeedback.ok ? (
            <div className="mb-2">
              <StateBanner kind="empty" message={props.actionFeedback.ok} />
            </div>
          ) : null}
          {props.actionFeedback?.kind === "note" && props.actionFeedback.error ? (
            <div className="mb-2">
              <StateBanner kind="error" message={props.actionFeedback.error} />
            </div>
          ) : null}
          <p className="text-xs font-extrabold text-slate-700">메모 작성</p>
          <textarea
            name="noteBody"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
            rows={4}
            required
            defaultValue={props.draftNoteBody !== undefined ? props.draftNoteBody : props.initialNoteText ?? ""}
            placeholder={
              props.variant === "student"
                ? "알면 좋을 배경이나 수업 이야기를 짧게 적을 수 있어요."
                : "다음 답·안내에 참고할 점을 적어 두세요."
            }
          />
          {props.roomId ? <input type="hidden" name="roomId" value={props.roomId} /> : null}
          <input type="hidden" name="actor" value={props.variant} />
          <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
          <FormSubmitButton
            idleLabel="저장"
            pendingLabel="저장 중…"
            className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
          />
        </form>
      ) : null}
    </>
  );

  if (surface === "list") {
    return (
      <div className="mx-auto w-full max-w-6xl" id="question-rooms">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            {props.variant === "student" ? "학생 · 질문방" : "멘토 · 질문방"}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{props.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{props.subtitle}</p>
          {props.actionFeedback?.ok ? (
            <div className="mt-4">
              <StateBanner kind="empty" message={props.actionFeedback.ok} />
            </div>
          ) : null}
          {props.actionFeedback?.error ? (
            <div className="mt-4">
              <StateBanner kind="error" message={props.actionFeedback.error} />
            </div>
          ) : null}
        </header>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-6 lg:grid-cols-12 lg:items-start">
          {/* 좌: 요약·빠른 메뉴 */}
          <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-3">
            <Panel title="작업 메뉴" tone="slate">
              <p className="text-xs text-slate-500">빠른 이동</p>
              <div className="mt-2 space-y-1.5">
                {props.variant === "student" ? (
                  <>
                    {quickLinkItem("/mentors", "멘토 찾기")}
                    {quickLinkItem("/subscriptions", "멤버십·구독")}
                    {quickLinkItem("/notes", "연결 노트")}
                    {quickLinkItem("/question-room", "질문방 새로고침")}
                  </>
                ) : (
                  <>
                    {quickLinkItem("/mentor/dashboard", "대시보드")}
                    {quickLinkItem("/mentor/channel", "채널")}
                    {quickLinkItem("/mentor/question-room#question-rooms", "이 목록으로 이동")}
                  </>
                )}
              </div>
            </Panel>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
              <p className="font-extrabold text-slate-800">필터</p>
              <p className="mt-1">검색·필터는 이후 연결 예정입니다. 현재는 전체 질문방이 표시됩니다.</p>
            </div>
          </div>

          {/* 중: room 목록 */}
          <div className="order-1 lg:order-2 lg:col-span-6">
            <Panel title={props.variant === "student" ? "내 질문방" : "학생과의 질문방"} tone={tone}>
              {props.rooms.loading ? <StateBanner kind="loading" message="질문방을 불러오는 중…" /> : null}
              {!props.rooms.loading && props.rooms.error ? (
                <StateBanner kind="error" message={publicQnaPanelError("rooms", props.rooms.error)} />
              ) : null}
              {!props.rooms.loading && !props.rooms.error && props.rooms.rows.length === 0 ? (
                <StateBanner kind="empty" message={listEmptyRoomMsg} />
              ) : null}
              {roomList}
            </Panel>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {props.variant === "student"
                ? "멘토와 연결되면 이곳에서 질문과 답변을 이어갈 수 있어요. 방을 누르면 상세에서 스레드·대화로 이동합니다."
                : "아래에서 학생의 질문방을 열면 질문·답변·연결 메모로 이어갈 수 있어요."}
            </p>
          </div>

          {/* 우: 보조 패널 */}
          <aside className="order-3 lg:col-span-3">
            <Panel title={props.variant === "student" ? "알림·가이드" : "답변·가이드"} tone="slate" className="h-full min-h-0">
              {props.variant === "student" ? (
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-extrabold text-slate-800">구독</p>
                    <p className="mt-1 text-xs">구독·결제는 멤버십 메뉴에서 확인하세요. 질문방은 멘토와 연결된 뒤 열립니다.</p>
                    <p className="mt-2">
                      <Link href="/subscriptions" className="font-bold text-blue-700 underline">
                        구독으로 이동
                      </Link>
                    </p>
                  </div>
                  <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                    자주 쓰는 답변·질문 템플릿은 준비 중이에요.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                    학생 프로필·원장 요약이 여기에 연결될 수 있어요. 현재는 이 방을 연 학생·멘토 관계만 표시됩니다.
                  </div>
                  <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                    답변 템플릿·공지는 이후 지원될 수 있어요.
                  </div>
                </div>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {feedbackStrip({ ok: props.actionFeedback?.ok, error: props.actionFeedback?.error })}

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {props.variant === "student" ? "멘토와의 질문방" : "학생 질문방"}
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{detailContextTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{detailContextSubtitle}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {props.threadId
            ? props.variant === "student"
              ? "질문 주제를 선택한 상태입니다. 중앙에서 대화를 이어가세요."
              : "답할 질문 주제가 열려 있습니다."
            : props.threads.rows.length
              ? "질문 주제를 한 가지 이상 골라 주세요."
              : "먼저 질문 주제를 추가할 수 있어요."}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        {/* 좌: room + thread + 새 주제 */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <Panel title="다른 질문방" tone={tone} className="shrink-0">
            {props.rooms.loading ? <StateBanner kind="loading" message="질문방을 불러오는 중…" /> : null}
            {!props.rooms.loading && props.rooms.error ? (
              <StateBanner kind="error" message={publicQnaPanelError("rooms", props.rooms.error)} />
            ) : null}
            {!props.rooms.loading && !props.rooms.error && props.rooms.rows.length === 0 ? (
              <StateBanner kind="empty" message={listEmptyRoomMsg} />
            ) : null}
            {roomList}
          </Panel>
          <Panel title="질문 주제" tone="slate" className="min-h-0 flex-1">
            {threadListBlock}
            {newThreadForm}
          </Panel>
        </div>

        {/* 중: 대화(스크롤) + 하단 입력 */}
        <div className="flex min-h-0 flex-col gap-0 lg:col-span-6">
          <div className="flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:min-h-[min(70vh,40rem)]">
            <div className="shrink-0 border-b border-slate-100 px-4 py-2.5 sm:px-5">
              <h2 className="text-sm font-extrabold text-slate-900">대화</h2>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
              {props.messages.loading ? <StateBanner kind="loading" message="대화를 불러오는 중…" /> : null}
              {!props.messages.loading && props.messages.error ? (
                <StateBanner kind="error" message={publicQnaPanelError("messages", props.messages.error)} />
              ) : null}
              {!props.messages.loading && !props.messages.error && props.messages.rows.length === 0 ? (
                <StateBanner
                  kind="empty"
                  message={
                    !props.threadId
                      ? props.threads.rows.length
                        ? "질문 주제를 먼저 골라 주시면 대화가 이곳에 표시됩니다."
                        : "질문 주제를 만든 뒤 대화를 시작할 수 있어요."
                      : "아직 남긴 말이 없습니다. 먼저 이야기를 시작해 주세요."
                  }
                />
              ) : null}
              {messagesList}
            </div>
            {messageFormBlock ? <div className="sticky bottom-0 z-10 mt-auto shrink-0 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] pt-0">{messageFormBlock}</div> : null}
          </div>
        </div>

        {/* 우: 연결 메모 + 안내 */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {connectionNotesBlock}
          </section>
          <Panel title={props.variant === "student" ? "빠른 링크" : "빠른 링크"} tone="slate" className="shrink-0 text-sm">
            <div className="space-y-1.5">
              {props.variant === "student" ? (
                <>
                  {quickLinkItem("/question-room", "질문방 목록")}
                  {quickLinkItem("/subscriptions", "구독·멤버십")}
                </>
              ) : (
                <>
                  {quickLinkItem("/mentor/question-room", "답변 대기 목록")}
                  {quickLinkItem("/mentor/dashboard", "대시보드")}
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">학생·구독 상세 정보는 이후 이 패널에 연결될 수 있어요. 지금은 안내만 표시됩니다.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
