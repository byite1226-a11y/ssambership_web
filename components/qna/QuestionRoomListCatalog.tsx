"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatQuestionRoomDateTime } from "@/lib/qna/formatQuestionRoomDisplay";
import {
  listFilterTabAndChip,
  listTabMatchesFilter,
  messageBodyPreview,
  type QuestionRoomListFilterTab,
} from "@/lib/qna/questionRoomUiLabels";
import type { QuestionRoomListPreview } from "@/lib/qna/questionRoomQueries";

type Row = Record<string, unknown>;

const chipToneClass = {
  slate: "border-slate-200 bg-slate-100 text-slate-800",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  blue: "border-blue-200 bg-blue-50 text-blue-950",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

function roomTitle(r: Row): string {
  for (const k of ["title", "topic", "name", "label"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "질문방";
}

function roomUpdatedDisplay(r: Row): string | null {
  for (const k of ["updated_at", "created_at"] as const) {
    const v = r[k];
    if (typeof v !== "string") continue;
    const out = formatQuestionRoomDateTime(v);
    if (out) return out;
  }
  return null;
}

function threadTitle(p: QuestionRoomListPreview | undefined): string {
  const t = p?.latestThread;
  if (!t) return "아직 질문 주제가 없어요";
  for (const k of ["title", "subject", "topic"] as const) {
    const v = t[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "질문 주제";
}

function counterpartyLabel(variant: "student" | "mentor"): string {
  return variant === "student" ? "연결 멘토" : "학생";
}

function roomHrefFromBase(roomHrefBase: string, roomId: string): string {
  const base = roomHrefBase.replace(/\/$/, "");
  return `${base}/${encodeURIComponent(roomId)}`;
}

export function QuestionRoomListCatalog(props: {
  variant: "student" | "mentor";
  title: string;
  subtitle: string;
  rooms: { rows: Row[]; error: string | null; loading: boolean };
  listPreviewsByRoomId: Record<string, QuestionRoomListPreview>;
  roomHrefBase: string;
  startQuestionHref: string;
  startQuestionLabel: string;
  secondaryCta?: { href: string; label: string };
}) {
  const [tab, setTab] = useState<QuestionRoomListFilterTab>("all");

  const tabs: { id: QuestionRoomListFilterTab; label: string }[] = useMemo(
    () => [
      { id: "all", label: "전체" },
      { id: "waiting", label: "답변 대기" },
      { id: "needReview", label: props.variant === "student" ? "답변 도착 · 확인 필요" : "학생 확인 대기" },
      { id: "done", label: "완료" },
    ],
    [props.variant]
  );

  const summary = useMemo(() => {
    let waiting = 0;
    let need = 0;
    let done = 0;
    for (const r of props.rooms.rows) {
      const id = r.id != null ? String(r.id) : "";
      if (!id) continue;
      const pv = props.listPreviewsByRoomId[id];
      const { tab: chipTab } = listFilterTabAndChip(props.variant, r, pv?.latestThread ?? null, pv?.lastMessage ?? null);
      if (chipTab === "waiting") waiting += 1;
      else if (chipTab === "needReview") need += 1;
      else if (chipTab === "done") done += 1;
    }
    return { waiting, need, done };
  }, [props.listPreviewsByRoomId, props.rooms.rows, props.variant]);

  const filteredRooms = useMemo(() => {
    return props.rooms.rows.filter((r) => {
      const id = r.id != null ? String(r.id) : "";
      if (!id) return false;
      const pv = props.listPreviewsByRoomId[id];
      const { tab: chipTab } = listFilterTabAndChip(props.variant, r, pv?.latestThread ?? null, pv?.lastMessage ?? null);
      return listTabMatchesFilter(tab, chipTab);
    });
  }, [props.listPreviewsByRoomId, props.rooms.rows, props.variant, tab]);

  const listEmptyRoomMsg =
    props.variant === "student"
      ? "아직 연결된 질문방이 없습니다. 멘토 구독 후 질문방이 열립니다."
      : "아직 연결된 학생 질문방이 없습니다.";

  const statMini = (label: string, value: number, tone: "slate" | "amber" | "emerald") => {
    const ring =
      tone === "amber"
        ? "border-amber-100 bg-amber-50/80"
        : tone === "emerald"
          ? "border-emerald-100 bg-emerald-50/80"
          : "border-slate-100 bg-white";
    return (
      <div className={`min-w-0 rounded-2xl border px-3 py-2.5 shadow-sm ${ring}`}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black tabular-nums text-slate-900">{value}</p>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl" id="question-rooms">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          {props.variant === "student" ? "학생 · 질문방" : "멘토 · 질문방"}
        </p>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{props.title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{props.subtitle}</p>
          </div>
          <div className="flex min-w-0 shrink-0 flex-wrap gap-2">
            <Link
              href={props.startQuestionHref}
              className="inline-flex h-9 min-h-9 items-center justify-center rounded-2xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 sm:h-10 sm:px-4 sm:text-sm"
            >
              {props.startQuestionLabel}
            </Link>
            {props.secondaryCta ? (
              <Link
                href={props.secondaryCta.href}
                className="inline-flex h-9 min-h-9 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:h-10 sm:px-4 sm:text-sm"
              >
                {props.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:py-3">
            <p className="text-[10px] font-bold text-slate-500">답변 대기</p>
            <p className="mt-0.5 text-lg font-black tabular-nums text-slate-900 sm:text-xl">{summary.waiting}</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:py-3">
            <p className="text-[10px] font-bold text-slate-500">
              {props.variant === "student" ? "답변 도착 · 확인" : "학생 확인 대기"}
            </p>
            <p className="mt-0.5 text-lg font-black tabular-nums text-slate-900 sm:text-xl">{summary.need}</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:py-3">
            <p className="text-[10px] font-bold text-slate-500">완료</p>
            <p className="mt-0.5 text-lg font-black tabular-nums text-slate-900 sm:text-xl">{summary.done}</p>
          </div>
        </div>
      </section>

      <div className="mt-4 grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* 좌측: 요약·바로가기 (reference 좌측 대시보드 느낌) */}
        <aside className="min-w-0 space-y-2 lg:col-span-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">요약</p>
          <div className="space-y-2">
            {statMini("답변 대기", summary.waiting, "slate")}
            {statMini(props.variant === "student" ? "확인 필요" : "확인 대기", summary.need, "amber")}
            {statMini("완료", summary.done, "emerald")}
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">바로가기</p>
            <div className="mt-2 space-y-1.5 text-xs font-bold">
              {props.variant === "student" ? (
                <>
                  <Link className="block truncate text-blue-700 underline-offset-2 hover:underline" href="/notes">
                    연결 노트
                  </Link>
                  <Link className="block truncate text-blue-700 underline-offset-2 hover:underline" href="/mentors">
                    멘토 찾기
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className="block truncate text-emerald-800 underline-offset-2 hover:underline"
                    href="/mentor/dashboard"
                  >
                    대시보드
                  </Link>
                  <Link
                    className="block truncate text-emerald-800 underline-offset-2 hover:underline"
                    href="/mentor/channel"
                  >
                    채널
                  </Link>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* 중앙: 탭 + 목록 */}
        <div className="min-w-0 lg:col-span-7">
          <div className="flex min-w-0 flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  "inline-flex min-h-8 min-w-0 shrink items-center rounded-xl px-3 py-1.5 text-[11px] font-bold transition sm:text-xs",
                  tab === t.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2.5">
            {props.rooms.loading ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-950">
                질문방을 불러오는 중…
              </div>
            ) : null}
            {props.rooms.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-950">
                {props.rooms.error}
              </div>
            ) : null}
            {!props.rooms.loading && !props.rooms.error && props.rooms.rows.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
                <p className="text-base font-extrabold text-slate-900">아직 질문방이 없어요</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{listEmptyRoomMsg}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link
                    href={props.startQuestionHref}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    {props.startQuestionLabel}
                  </Link>
                  {props.variant === "student" ? (
                    <Link
                      href="/subscriptions"
                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
                    >
                      구독 안내 보기
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!props.rooms.loading && !props.rooms.error && filteredRooms.length === 0 && props.rooms.rows.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm font-semibold text-slate-700">
                이 상태에 해당하는 질문방이 없습니다. 다른 탭을 눌러 보세요.
              </div>
            ) : null}

            {filteredRooms.map((r) => {
              const id = r.id != null ? String(r.id) : "";
              const pv = id ? props.listPreviewsByRoomId[id] : undefined;
              const chip = listFilterTabAndChip(props.variant, r, pv?.latestThread ?? null, pv?.lastMessage ?? null);
              const preview = messageBodyPreview(pv?.lastMessage ?? null, 100);
              const updated = roomUpdatedDisplay(r);
              const href = id ? roomHrefFromBase(props.roomHrefBase, id) : "#";
              const openLabel =
                props.variant === "student"
                  ? "질문방 열기"
                  : chip.tab === "waiting"
                    ? "답변하기"
                    : "대화 열기";
              const accentMentor = props.variant === "mentor" && chip.tab === "waiting";
              const accentStudentNeed = props.variant === "student" && chip.tab === "needReview";
              return (
                <article
                  key={id || "room"}
                  className={[
                    "min-w-0 rounded-3xl border bg-white p-3.5 shadow-sm transition sm:p-4",
                    accentMentor ? "border-l-[5px] border-l-blue-500 border-y-slate-200 border-r-slate-200" : "",
                    accentStudentNeed ? "border-l-[5px] border-l-amber-400 border-y-slate-200 border-r-slate-200" : "",
                    !accentMentor && !accentStudentNeed ? "border-slate-200 hover:border-slate-300" : "",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="min-w-0 truncate text-sm font-extrabold text-slate-900 sm:text-base">{roomTitle(r)}</h2>
                        <span
                          className={[
                            "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-[10px] font-bold sm:text-[11px]",
                            chipToneClass[chip.tone],
                          ].join(" ")}
                        >
                          {chip.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{counterpartyLabel(props.variant)}</p>
                      <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-700">
                        <span className="font-semibold text-slate-400">최근 · </span>
                        {preview || "아직 주고받은 메시지가 없어요."}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        주제 · {threadTitle(pv)}
                        {updated ? <span> · {updated}</span> : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <Link
                        href={href}
                        className="inline-flex h-9 min-h-9 items-center justify-center rounded-2xl bg-slate-900 px-3.5 text-[11px] font-bold text-white shadow-sm hover:bg-slate-800 sm:h-10 sm:px-4 sm:text-xs"
                      >
                        {openLabel}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* 우측: 이용 안내 */}
        <aside className="min-w-0 lg:col-span-3">
          <section className="sticky top-4 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-slate-900">
              {props.variant === "student" ? "질문방 이용 순서" : "답변 운영 안내"}
            </h2>
            {props.variant === "student" ? (
              <ol className="mt-3 space-y-2.5 text-sm text-slate-700">
                <li className="flex min-w-0 gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-black text-blue-800">
                    1
                  </span>
                  <span className="min-w-0">
                    <span className="font-bold text-slate-900">질문 작성</span>
                    <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500">
                      주제를 정하고 궁금한 점을 남겨 주세요.
                    </span>
                  </span>
                </li>
                <li className="flex min-w-0 gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-black text-blue-800">
                    2
                  </span>
                  <span className="min-w-0">
                    <span className="font-bold text-slate-900">멘토 답변</span>
                    <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500">
                      답변이 오면 내용을 꼼꼼히 확인해 주세요.
                    </span>
                  </span>
                </li>
                <li className="flex min-w-0 gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-black text-blue-800">
                    3
                  </span>
                  <span className="min-w-0">
                    <span className="font-bold text-slate-900">확인 후 이어가기</span>
                    <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500">
                      추가 질문이 있으면 같은 질문방에서 이어서 남길 수 있어요.
                    </span>
                  </span>
                </li>
                <li className="flex min-w-0 gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-700">
                    4
                  </span>
                  <span className="min-w-0">
                    <span className="font-bold text-slate-900">마무리</span>
                    <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500">
                      주제가 끝나면 상태가 완료로 보일 수 있어요.
                    </span>
                  </span>
                </li>
              </ol>
            ) : (
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                <li className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-xs font-extrabold text-emerald-900">좋은 답변</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-emerald-950/90">
                    요지를 먼저 말하고, 학생이 바로 실행할 수 있는 단계로 정리해 주세요.
                  </p>
                </li>
                <li className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-extrabold text-slate-900">답변 이후</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                    전달 후에는 학생이 확인할 때까지 기다리는 단계입니다. 완료로 오해하지 않도록 안내해 두었습니다.
                  </p>
                </li>
                <li className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-extrabold text-slate-900">플랫폼 내 소통</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                    개인 연락처는 나누지 말고, 이 질문방에서만 대화를 이어가 주세요.
                  </p>
                </li>
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
