import Link from "next/link";
import type { ReactNode } from "react";
import { FormSubmitButton } from "@/components/qna/FormSubmitButton";
import {
  createQuestionMessageAction,
  createQuestionThreadAction,
  saveConnectionNoteAction,
} from "@/lib/qna/questionRoomActions";

type Row = Record<string, unknown>;

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "blue" | "green" | "slate";
  children: ReactNode;
}) {
  const border =
    tone === "blue"
      ? "border-blue-200"
      : tone === "green"
        ? "border-emerald-200"
        : "border-slate-200";
  return (
    <section className={`rounded-2xl border ${border} bg-white p-4`}>
      <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
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

export function QuestionRoomWorkspace(props: {
  variant: "student" | "mentor";
  /** 목록 라우트에서는 room만 채우고, thread/message/notes는 상세로 유도 */
  surface?: "list" | "detail";
  actionFeedback?: { kind?: "thread" | "message" | "note"; ok: string | null; error: string | null };
  title: string;
  subtitle: string;
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

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">QnA / {props.variant}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{props.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{props.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">room → thread → message</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">connection_notes = room scope</span>
        </div>
        {props.actionFeedback?.ok ? <StateBanner kind="empty" message={props.actionFeedback.ok} /> : null}
        {props.actionFeedback?.error ? <StateBanner kind="error" message={props.actionFeedback.error} /> : null}
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Panel title={props.variant === "student" ? "Rooms (학생 기준)" : "Rooms (멘토 기준)"} tone={tone}>
            {props.rooms.loading ? <StateBanner kind="loading" message="rooms 조회 중…" /> : null}
            {!props.rooms.loading && props.rooms.error ? <StateBanner kind="error" message={props.rooms.error} /> : null}
            {!props.rooms.loading && !props.rooms.error && props.rooms.rows.length === 0 ? (
              <StateBanner kind="empty" message="아직 생성된 room이 없습니다." />
            ) : null}
            <ul className="mt-3 space-y-2">
              {props.rooms.rows.map((r) => {
                const id = (r.id as string | undefined) ?? "";
                const label =
                  (typeof r.title === "string" && r.title) ||
                  (typeof r.topic === "string" && r.topic) ||
                  (id ? `room ${id.slice(0, 8)}…` : "room");
                const active = props.roomId && id && props.roomId === id;
                return (
                  <li key={id || JSON.stringify(r)}>
                    {props.buildRoomHref && id ? (
                      <Link
                        href={props.buildRoomHref(id)}
                        className={[
                          "block rounded-xl border px-3 py-2 text-sm font-bold",
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
                      <div className="block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800">
                        {label}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="lg:col-span-4">
          <Panel title="Threads" tone="slate">
            {props.threads.loading ? <StateBanner kind="loading" message="threads 조회 중…" /> : null}
            {!props.threads.loading && props.threads.error ? <StateBanner kind="error" message={props.threads.error} /> : null}
            {!props.threads.loading && !props.threads.error && props.threads.rows.length === 0 ? (
              <StateBanner
                kind="empty"
                message={
                  surface === "list"
                    ? "room을 열면(상세) thread 목록을 조회합니다. 목록 화면은 room 큐만 실연결합니다."
                    : "이 room에 thread가 아직 없습니다."
                }
              />
            ) : null}
            <ul className="mt-3 space-y-2">
              {props.threads.rows.map((t) => {
                const id = (t.id as string | undefined) ?? "";
                const label =
                  (typeof t.title === "string" && t.title) ||
                  (typeof t.subject === "string" && t.subject) ||
                  (id ? `thread ${id.slice(0, 8)}…` : "thread");
                const active = props.threadId && id && props.threadId === id;
                return (
                  <li key={id || JSON.stringify(t)}>
                    {props.roomId && props.buildThreadHref && id ? (
                      <Link
                        href={props.buildThreadHref(props.roomId, id)}
                        className={[
                          "block rounded-xl border px-3 py-2 text-sm font-bold",
                          active ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300",
                        ].join(" ")}
                      >
                        {label}
                      </Link>
                    ) : (
                      <div className="block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800">
                        {label}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {surface === "detail" ? (
              <form
                key={`thread-form-${rev}`}
                action={createQuestionThreadAction}
                className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs font-extrabold text-slate-700">새 thread 생성</p>
                {props.actionFeedback?.kind === "thread" && props.actionFeedback.error ? (
                  <div className="mt-2">
                    <StateBanner kind="error" message={props.actionFeedback.error} />
                  </div>
                ) : null}
                <input
                  name="threadTitle"
                  required
                  defaultValue={props.draftThreadTitle ?? ""}
                  placeholder={props.variant === "student" ? "질문 주제 입력" : "답변할 주제 thread 입력"}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
                {props.roomId ? <input type="hidden" name="roomId" value={props.roomId} /> : null}
                <input type="hidden" name="actor" value={props.variant} />
                <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
                <FormSubmitButton
                  idleLabel="thread 추가"
                  pendingLabel="thread 생성 중..."
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                />
              </form>
            ) : null}
          </Panel>
        </div>

        <div className="lg:col-span-5">
          <Panel title="Messages (선택 thread)" tone={tone}>
            {props.messages.loading ? <StateBanner kind="loading" message="messages 조회 중…" /> : null}
            {!props.messages.loading && props.messages.error ? <StateBanner kind="error" message={props.messages.error} /> : null}
            {!props.messages.loading && !props.messages.error && props.messages.rows.length === 0 ? (
              <StateBanner
                kind="empty"
                message={
                  surface === "list"
                    ? "message는 room 상세에서 thread를 선택한 뒤 조회합니다."
                    : props.threadId
                      ? "이 thread에 message가 아직 없습니다."
                      : props.threads.rows.length
                        ? "thread를 선택하면 messages를 불러옵니다."
                        : "thread가 없으면 message도 표시할 수 없습니다."
                }
              />
            ) : null}
            <div className="mt-3 space-y-2">
              {props.messages.rows.map((m) => {
                const body =
                  (typeof m.body === "string" && m.body) ||
                  (typeof m.content === "string" && m.content) ||
                  (typeof m.text === "string" && m.text) ||
                  null;
                return (
                  <div key={(m.id as string | undefined) || JSON.stringify(m)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
                    <p className="whitespace-pre-wrap font-semibold">{body ?? "메시지 본문 컬럼을 확인하세요(스키마에 content/body/text 등)."}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-bold text-slate-500">raw</summary>
                      <JsonPreview value={m} />
                    </details>
                  </div>
                );
              })}
            </div>
            {surface === "detail" ? (
              <form
                key={`msg-${props.threadId ?? "none"}-${rev}-${props.draftMessageBody?.length ?? 0}`}
                action={createQuestionMessageAction}
                className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs font-extrabold text-slate-700">
                  {props.variant === "student" ? "학생 질문 작성" : "멘토 답변 작성"}
                </p>
                {props.actionFeedback?.kind === "message" && props.actionFeedback.error ? (
                  <div className="mt-2">
                    <StateBanner kind="error" message={props.actionFeedback.error} />
                  </div>
                ) : null}
                <textarea
                  name="messageBody"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                  rows={4}
                  required
                  defaultValue={props.draftMessageBody ?? ""}
                  placeholder={
                    props.threadId
                      ? props.variant === "student"
                        ? "선택된 thread에 질문 내용을 입력하세요."
                        : "선택된 thread에 답변 내용을 입력하세요."
                      : "thread를 먼저 선택하세요."
                  }
                  disabled={!props.threadId}
                />
                {props.threadId ? <input type="hidden" name="threadId" value={props.threadId} /> : null}
                {props.roomId ? <input type="hidden" name="roomId" value={props.roomId} /> : null}
                <input type="hidden" name="actor" value={props.variant} />
                <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
                <FormSubmitButton
                  idleLabel={props.variant === "student" ? "질문 보내기" : "답변 보내기"}
                  pendingLabel={props.variant === "student" ? "질문 전송 중..." : "답변 전송 중..."}
                  disabled={!props.threadId}
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                />
              </form>
            ) : null}
          </Panel>
        </div>
      </div>

      <Panel title="Connection notes (room 단위)" tone="slate">
        {props.notes.loading ? <StateBanner kind="loading" message="connection_notes 조회 중…" /> : null}
        {!props.notes.loading && props.notes.error ? <StateBanner kind="error" message={props.notes.error} /> : null}
        {!props.notes.loading && !props.notes.error && props.notes.rows.length === 0 ? (
          <StateBanner
            kind="empty"
            message={surface === "list" ? "connection notes는 room 상세에서 room_id 기준으로 조회합니다." : "room에 연결된 connection note가 없습니다."}
          />
        ) : null}
        <div className="mt-3 space-y-2">
          {props.notes.rows.map((n) => (
            <div key={(n.id as string | undefined) || JSON.stringify(n)} className="rounded-xl border border-slate-200 bg-white p-3">
              <JsonPreview value={n} />
            </div>
          ))}
        </div>
        {surface === "detail" ? (
          <form key={`note-form-${rev}`} action={saveConnectionNoteAction} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-extrabold text-slate-700">connection note 저장 (room 단위)</p>
            {props.actionFeedback?.kind === "note" && props.actionFeedback.ok ? (
              <div className="mt-2">
                <StateBanner kind="empty" message={props.actionFeedback.ok} />
              </div>
            ) : null}
            {props.actionFeedback?.kind === "note" && props.actionFeedback.error ? (
              <div className="mt-2">
                <StateBanner kind="error" message={props.actionFeedback.error} />
              </div>
            ) : null}
            <textarea
              name="noteBody"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
              rows={4}
              required
              defaultValue={props.draftNoteBody !== undefined ? props.draftNoteBody : props.initialNoteText ?? ""}
              placeholder="이 room의 연결 노트를 입력하세요."
            />
            {props.roomId ? <input type="hidden" name="roomId" value={props.roomId} /> : null}
            <input type="hidden" name="actor" value={props.variant} />
            <input type="hidden" name="contextThreadId" value={props.threadId ?? ""} />
            <FormSubmitButton
              idleLabel="note 저장"
              pendingLabel="note 저장 중..."
              className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
            />
          </form>
        ) : null}
      </Panel>
    </div>
  );
}
