"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MessageCircle,
  RotateCcw,
  ChevronRight,
  User,
  Paperclip,
  MessageSquare,
  Bookmark,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  messageBodyPreview,
  type QuestionRoomListFilterTab,
  listFilterTabAndChip,
  listTabMatchesFilter,
} from "@/lib/qna/questionRoomUiLabels";
import type { QuestionRoomListPreview } from "@/lib/qna/questionRoomQueries";
import { roomDetailPath, threadInRoomPath } from "@/lib/qna/formatQuestionRoomDisplay";

type Row = Record<string, unknown>;

function roomTitle(r: Row): string {
  for (const k of ["title", "topic", "name", "label", "student_name"] as const) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "이름 미설정";
}

function extractNoteText(n: Row | undefined): string {
  if (!n) return "";
  return (
    (typeof n.body === "string" && n.body) ||
    (typeof n.content === "string" && n.content) ||
    (typeof n.text === "string" && n.text) ||
    (typeof n.note === "string" && n.note) ||
    ""
  );
}

export function MentorQuestionRoomDashboard(props: {
  rooms: { rows: Row[]; error: string | null; loading: boolean };
  listPreviewsByRoomId: Record<string, QuestionRoomListPreview>;
  roomHrefBase: string;
}) {
  const [activeTab, setActiveTab] = useState<QuestionRoomListFilterTab>("all");
  const [userSelectedRoomId, setUserSelectedRoomId] = useState<string | null>(null);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMdUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const filteredRooms = useMemo(() => {
    return props.rooms.rows.filter((r) => {
      const id = r.id != null ? String(r.id) : "";
      if (!id) return false;
      const pv = props.listPreviewsByRoomId[id];
      const { tab: chipTab } = listFilterTabAndChip("mentor", r, pv?.latestThread ?? null, pv?.lastMessage ?? null);
      return listTabMatchesFilter(activeTab, chipTab);
    });
  }, [props.listPreviewsByRoomId, props.rooms.rows, activeTab]);

  const selectedRoomId = useMemo(() => {
    if (userSelectedRoomId) {
      const exists = filteredRooms.some((r) => String(r.id) === userSelectedRoomId);
      if (exists) return userSelectedRoomId;
    }
    if (isMdUp && filteredRooms.length > 0) return String(filteredRooms[0].id);
    return null;
  }, [userSelectedRoomId, filteredRooms, isMdUp]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return props.rooms.rows.find((r) => String(r.id) === selectedRoomId);
  }, [selectedRoomId, props.rooms.rows]);

  const selectedPreview = useMemo(() => {
    return selectedRoomId ? props.listPreviewsByRoomId[selectedRoomId] : null;
  }, [selectedRoomId, props.listPreviewsByRoomId]);

  const roomBase = props.roomHrefBase || "/mentor/question-room";
  const mobileShowsDetail = Boolean(selectedRoom && (isMdUp || userSelectedRoomId != null));

  const selectRoom = (id: string) => {
    setUserSelectedRoomId(id);
    setChatExpanded(false);
  };

  const backToList = () => {
    setUserSelectedRoomId(null);
    setChatExpanded(false);
  };

  return (
    <div
      className="grid h-[calc(100vh-80px)] min-h-[600px] w-full min-w-0 grid-cols-1 overflow-hidden border-t border-slate-200 bg-white font-sans text-slate-900 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_280px]"
    >
      {/* [좌측] 학생 질문방 목록 */}
      <aside
        className={`min-w-0 flex-col overflow-hidden border-r border-slate-200 bg-white ${
          mobileShowsDetail ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="shrink-0 p-4 pb-2 md:p-6">
          <h1 className="text-[18px] font-black text-slate-900">질문방 목록</h1>
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="학생명 검색"
                disabled
                className="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[12px] font-medium opacity-50 outline-none"
              />
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(["all", "waiting", "done"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-black transition-all ${
                    activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t === "all" ? "전체" : t === "waiting" ? "대기" : "완료"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="custom-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto md:mt-4">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => {
              const id = String(room.id);
              const pv = props.listPreviewsByRoomId[id];
              const isSelected = selectedRoomId === id;
              const studentName = roomTitle(room);
              const previewText = messageBodyPreview(pv?.lastMessage ?? null, 40) || "최근 대화 없음";

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectRoom(id)}
                  className={`relative flex w-full items-start gap-3 border-b border-slate-50 px-4 py-4 text-left transition-all md:px-6 ${
                    isSelected ? "bg-blue-50/70 shadow-[inset_3px_0_0_0_#2563EB]" : "hover:bg-blue-50/40"
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`truncate text-[13px] font-black ${isSelected ? "text-slate-900" : "text-slate-700"}`}
                      >
                        {studentName}
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                        학생
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[11px] font-medium text-slate-500">{previewText}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-10 text-center text-[12px] font-bold text-slate-400">질문방이 없습니다.</div>
          )}
        </div>
      </aside>

      {/* [중앙+우측] md: 세로 스택 · lg: 그리드 2·3열 분리 */}
      <div
        className={`min-w-0 overflow-hidden md:col-span-1 md:flex md:min-h-0 md:flex-col lg:contents ${
          mobileShowsDetail ? "flex min-h-0 flex-col" : "hidden md:flex"
        }`}
      >
        {/* [중앙] 질문 관리 & 히스토리 */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white md:border-r md:border-slate-100 lg:col-auto lg:row-auto lg:min-h-0">
          {selectedRoom ? (
            <>
              <header className="shrink-0 border-b border-slate-50 bg-white p-4 md:p-6">
                <button
                  type="button"
                  onClick={backToList}
                  className="mb-3 inline-flex items-center gap-1 text-[13px] font-bold text-blue-600 hover:text-blue-800 md:hidden"
                >
                  ← 목록으로
                </button>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 sm:h-14 sm:w-14">
                      <User className="h-6 w-6 text-slate-400 sm:h-7 sm:w-7" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-black text-slate-900 sm:text-[20px]">
                          {roomTitle(selectedRoom)}
                        </h2>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                          학생
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] font-bold text-slate-400">질문방 정보</p>
                    </div>
                  </div>
                  <Link
                    href={roomDetailPath(roomBase, String(selectedRoom.id))}
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-black text-white transition hover:bg-slate-800"
                  >
                    질문방 열기 <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </header>

              <div className="custom-scrollbar min-h-0 flex-1 space-y-8 overflow-y-auto p-4 md:space-y-10 md:p-6 lg:p-8">
                <section className="min-w-0">
                  <h3 className="mb-4 flex items-center gap-2 text-[15px] font-black text-slate-900 md:mb-5">
                    <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                    최근 질문
                  </h3>

                  {selectedPreview?.latestThread ? (
                    <Link
                      href={threadInRoomPath(roomBase, String(selectedRoom.id), String(selectedPreview.latestThread.id))}
                      className="group block min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 md:p-6"
                    >
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-700">
                        진행 중
                      </span>
                      <h4 className="mt-3 text-[15px] font-black text-slate-900 transition-colors group-hover:text-slate-700">
                        {(selectedPreview.latestThread.topic as string) || "질문 주제"}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-relaxed text-slate-500">
                        {messageBodyPreview(selectedPreview.lastMessage ?? null, 100) || "최근 대화 없음"}
                      </p>
                      <div className="mt-4 flex items-center justify-end border-t border-slate-50 pt-3 md:mt-5 md:pt-4">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                          상세 보기 <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-8">
                      <p className="text-[13px] font-bold italic text-slate-300">등록된 질문이 없습니다.</p>
                    </div>
                  )}
                </section>

                <section className="min-w-0">
                  <h3 className="mb-4 flex items-center gap-2 text-[15px] font-black text-slate-900 md:mb-5">
                    <Bookmark className="h-4 w-4 shrink-0 text-slate-500" />
                    학생 메모
                  </h3>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-6">
                    <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                      {extractNoteText(selectedRoom) || "상세 화면에서 학생/멘토 메모를 확인하세요."}
                    </p>
                  </div>
                </section>

                {/* lg 미만: 채팅 접기/펼치기 토글 */}
                <div className="min-w-0 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setChatExpanded((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-[13px] font-bold text-slate-800 transition hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-slate-500" />
                      {chatExpanded ? "채팅 미리보기 닫기" : "채팅 미리보기"}
                    </span>
                    {chatExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-slate-300">
              <RotateCcw className="h-12 w-12 text-slate-100" />
              <p className="text-center text-[15px] font-bold">학생을 선택하여 질문을 관리하세요.</p>
            </div>
          )}
        </main>

        {/* [우측] 실시간 질문방 */}
        <aside
          className={`min-w-0 flex-col overflow-hidden bg-white lg:flex lg:h-full lg:min-h-0 lg:border-l lg:border-slate-200 ${
            chatExpanded ? "flex max-h-[min(420px,50vh)] shrink-0 border-t border-slate-200 md:max-h-none md:flex-1" : "hidden"
          } lg:!flex lg:max-h-none`}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <header className="shrink-0 border-b border-slate-50 bg-white p-4 md:p-6">
              <h2 className="text-[15px] font-black text-slate-900">실시간 질문방</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">대화 미리보기</p>
            </header>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-4 md:p-6">
              {selectedRoom ? (
                <div className="min-w-0 space-y-6">
                  {selectedPreview?.lastMessage ? (
                    <div className="flex max-w-[90%] items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <p className="ml-1 text-[11px] font-bold text-slate-400">{roomTitle(selectedRoom)}</p>
                        <div className="rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 shadow-sm">
                          <p className="break-words text-[13px] font-medium leading-relaxed text-slate-700">
                            {messageBodyPreview(selectedPreview.lastMessage, 200)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-[12px] font-bold text-slate-300">최근 대화가 없습니다.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50">
                    <MessageCircle className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-300">선택된 질문방이 없습니다.</p>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-50 bg-white p-4 md:p-6">
              {selectedRoom ? (
                <Link
                  href={roomDetailPath(roomBase, String(selectedRoom.id))}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#142d61] text-[14px] font-black text-white transition hover:bg-[#0f2349] active:scale-95 md:h-14"
                >
                  상세 화면에서 답변하기
                </Link>
              ) : (
                <div className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-slate-100 text-[14px] font-black text-slate-400 md:h-14">
                  질문방을 선택해주세요
                </div>
              )}
              <div className="mt-3 flex items-center justify-center gap-2 text-slate-400 md:mt-4">
                <Paperclip className="h-4 w-4 opacity-30" />
                <span className="text-center text-[10px] font-bold">
                  첨부파일 및 상세 기능은 상세 페이지에서 제공됩니다.
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
