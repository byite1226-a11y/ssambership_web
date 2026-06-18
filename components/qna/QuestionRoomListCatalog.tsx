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
import { ListCard, type ListCardTone } from "@/components/design-system/ListCard";

type Row = Record<string, unknown>;

const chipToneClass = {
  slate: "border-slate-200/90 bg-slate-100 text-slate-800",
  amber: "border-amber-200/90 bg-amber-50 text-amber-950",
  blue: "border-blue-200/90 bg-blue-50 text-blue-950",
  emerald: "border-emerald-200/90 bg-emerald-50 text-emerald-900",
} as const;

// 질문방 상태칩 색 → 공용 카드 톤(좌측 액센트 바 색).
const CHIP_TONE_TO_CARD_TONE: Record<keyof typeof chipToneClass, ListCardTone> = {
  slate: "neutral",
  amber: "amber",
  blue: "blue",
  emerald: "green",
};

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

/**
 * Visual gap (reference vs prior build — 구현 시 체크):
 * - reference: 좌측 고정폭 요약 레일 + 중앙 고밀도 리스트 + 우측 다층 유틸 카드
 * - prior: 좌폭이 좁고 중앙·우측 카드 위계가 약함 → 3/6/3, 중첩 카드, 탭에 건수, 좌측 총계 배너
 */
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

  const tabCounts = useMemo(() => {
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
    const all = props.rooms.rows.length;
    return { all, waiting, need, done };
  }, [props.listPreviewsByRoomId, props.rooms.rows, props.variant]);

  const tabs: { id: QuestionRoomListFilterTab; label: string; count: number }[] = useMemo(
    () => [
      { id: "all", label: "전체", count: tabCounts.all },
      { id: "waiting", label: "답변 대기", count: tabCounts.waiting },
      {
        id: "needReview",
        label: props.variant === "student" ? "답변 도착 · 확인" : "학생 확인 대기",
        count: tabCounts.need,
      },
      { id: "done", label: "완료", count: tabCounts.done },
    ],
    [props.variant, tabCounts]
  );

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

  const accent = props.variant === "student" ? "blue" : "emerald";
  const accentBtn =
    accent === "blue"
      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[88rem]" id="question-rooms">
      {/* 상단: 타이틀 + CTA + 요약 — 한 덩어리로 밀도↑ */}
      <section className="rounded-3xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
              {props.variant === "student" ? "학생 · 질문방" : "멘토 · 질문방"}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{props.title}</h1>
            <p className="mt-1.5 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">{props.subtitle}</p>
          </div>
          <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
            <Link
              href={props.startQuestionHref}
              className={`inline-flex h-10 w-full items-center justify-center rounded-2xl px-4 text-sm font-bold text-white shadow-md transition sm:w-auto ${accentBtn}`}
            >
              {props.startQuestionLabel}
            </Link>
            {props.secondaryCta ? (
              <Link
                href={props.secondaryCta.href}
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                {props.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white px-3 py-3 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">답변 대기</p>
            <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-slate-900">{tabCounts.waiting}</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/90 to-white px-3 py-3 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/80">
              {props.variant === "student" ? "확인 필요" : "학생 확인"}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-slate-900">{tabCounts.need}</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white px-3 py-3 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-900/80">완료</p>
            <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-slate-900">{tabCounts.done}</p>
          </div>
        </div>
      </section>

      {/* 본문: 좌(요약·내비) / 중(탭+리스트) / 우(유틸 다층) */}
      <div className="mt-4 grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-x-5">
        {/* 좌측 레일 — reference 좌측 대시보드 */}
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:col-span-3 lg:self-start">
          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/50 to-slate-50/80 p-4 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">한눈에 보기</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{tabCounts.all}</p>
            <p className="text-xs font-semibold text-slate-500">연결된 질문방 수</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200/80 pt-4">
              <div className="min-w-0 text-center">
                <p className="text-lg font-black text-slate-900">{tabCounts.waiting}</p>
                <p className="text-[10px] font-bold text-slate-500">대기</p>
              </div>
              <div className="min-w-0 text-center">
                <p className="text-lg font-black text-amber-800">{tabCounts.need}</p>
                <p className="text-[10px] font-bold text-slate-500">확인</p>
              </div>
              <div className="min-w-0 text-center">
                <p className="text-lg font-black text-emerald-800">{tabCounts.done}</p>
                <p className="text-[10px] font-bold text-slate-500">완료</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">바로가기</p>
            <div className="mt-3 flex flex-col gap-2">
              {props.variant === "student" ? (
                <>
                  <Link
                    href="/mentors"
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-800 hover:border-blue-200 hover:bg-blue-50/60"
                  >
                    멘토 찾기
                  </Link>
                  <Link
                    href="/notes"
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-800 hover:border-blue-200 hover:bg-blue-50/60"
                  >
                    연결 노트
                  </Link>
                  <Link
                    href="/subscriptions"
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-800 hover:border-blue-200 hover:bg-blue-50/60"
                  >
                    구독·멤버십
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/mentor/mypage"
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/60"
                  >
                    마이페이지
                  </Link>
                  <Link
                    href="/mentor/channel"
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/60"
                  >
                    채널
                  </Link>
                  <Link
                    href="/mentor/question-room#question-rooms"
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/60"
                  >
                    목록 맨 위로
                  </Link>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* 중앙: 탭 + 리스트 — 흰 카드 안에 또 그룹 */}
        <div className="min-w-0 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-3 shadow-md sm:p-4">
            <div className="flex min-w-0 flex-wrap gap-1 rounded-2xl border border-slate-100 bg-slate-50/90 p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={[
                    "inline-flex min-h-9 min-w-0 flex-1 basis-[calc(50%-4px)] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-extrabold transition sm:basis-auto sm:px-3 sm:text-xs",
                    tab === t.id
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:bg-white/70",
                  ].join(" ")}
                >
                  <span className="truncate">{t.label}</span>
                  <span
                    className={[
                      "inline-flex min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-black tabular-nums",
                      tab === t.id ? "bg-slate-900 text-white" : "bg-slate-200/80 text-slate-700",
                    ].join(" ")}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-4">
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
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-lg font-extrabold text-slate-900">아직 질문방이 없어요</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{listEmptyRoomMsg}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Link
                      href={props.startQuestionHref}
                      className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold text-white shadow-md ${accentBtn}`}
                    >
                      {props.startQuestionLabel}
                    </Link>
                    {props.variant === "student" ? (
                      <Link
                        href="/subscriptions"
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-50"
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
                const preview = messageBodyPreview(pv?.lastMessage ?? null, 110);
                const updated = roomUpdatedDisplay(r);
                const href = id ? roomHrefFromBase(props.roomHrefBase, id) : "#";
                const openLabel =
                  props.variant === "student"
                    ? "질문방 열기"
                    : chip.tab === "waiting"
                      ? "답변하기"
                      : "대화 열기";
                return (
                  <ListCard
                    key={id || "room"}
                    as="article"
                    tone={CHIP_TONE_TO_CARD_TONE[chip.tone]}
                    interactive
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className={[
                              "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-[10px] font-extrabold sm:text-[11px]",
                              chipToneClass[chip.tone],
                            ].join(" ")}
                          >
                            {chip.label}
                          </span>
                          <h2 className="min-w-0 flex-1 truncate text-base font-extrabold text-slate-900">{roomTitle(r)}</h2>
                        </div>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          {counterpartyLabel(props.variant)}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-slate-700">
                          <span className="font-bold text-slate-400">최근</span>{" "}
                          {preview || "아직 주고받은 메시지가 없어요."}
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                          주제 · {threadTitle(pv)}
                          {updated ? <span className="text-slate-400"> · {updated}</span> : null}
                        </p>
                      </div>
                      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
                        <Link
                          href={href}
                          className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 text-xs font-extrabold text-white shadow-sm hover:bg-slate-800 sm:w-auto sm:min-w-[7.5rem]"
                        >
                          {openLabel}
                        </Link>
                      </div>
                    </div>
                  </ListCard>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측 유틸 — 다층 카드 */}
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:col-span-3 lg:self-start">
          <section className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {props.variant === "student" ? "이용 순서" : "운영 가이드"}
            </h2>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {props.variant === "student" ? "질문방을 이렇게 써 보세요" : "답변 품질을 올리는 팁"}
            </p>
            {props.variant === "student" ? (
              <ol className="mt-4 space-y-3 text-sm text-slate-700">
                {[
                  ["1", "질문 작성", "주제를 정하고 궁금한 점을 남겨 주세요."],
                  ["2", "멘토 답변", "답변이 오면 내용을 천천히 확인해 주세요."],
                  ["3", "이어서 질문", "추가로 묻고 싶으면 같은 방에서 이어서 작성해 주세요."],
                  ["4", "마무리", "주제가 끝나면 완료 상태로 보일 수 있어요."],
                ].map(([n, t, d]) => (
                  <li key={n} className="flex min-w-0 gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-800">
                      {n}
                    </span>
                    <span className="min-w-0">
                      <span className="font-bold text-slate-900">{t}</span>
                      <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="mt-4 space-y-3">
                <li className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-xs font-extrabold text-emerald-900">좋은 답변</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-emerald-950/90">
                    요지를 먼저 말하고, 실행 가능한 단계로 나누어 주세요.
                  </p>
                </li>
                <li className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-extrabold text-slate-900">답변 이후</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                    학생이 확인할 때까지 기다리는 구간입니다. 완료로 오해하지 않게 문구를 맞춰 두었습니다.
                  </p>
                </li>
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-dashed border-slate-200/90 bg-slate-50/60 p-4">
            <p className="text-xs font-extrabold text-slate-800">알아두면 좋아요</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
              {props.variant === "student"
                ? "멘토와의 대화는 이 질문방에만 남습니다. 개인 연락처를 나누지 않는 것이 안전합니다."
                : "학생에게 전달되는 문구는 이 화면에 쓰신 그대로 저장됩니다. 전송 전에 한 번 더 읽어 주세요."}
            </p>
            <div className="mt-3 grid gap-2">
              <Link
                href={props.roomHrefBase}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                목록 새로보기
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
