"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  return "학생";
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
      const exists = filteredRooms.some(r => String(r.id) === userSelectedRoomId);
      if (exists) return userSelectedRoomId;
    }
    return filteredRooms.length > 0 ? String(filteredRooms[0].id) : null;
  }, [userSelectedRoomId, filteredRooms]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return props.rooms.rows.find((r) => String(r.id) === selectedRoomId);
  }, [selectedRoomId, props.rooms.rows]);

  const selectedPreview = useMemo(() => {
    return selectedRoomId ? props.listPreviewsByRoomId[selectedRoomId] : null;
  }, [selectedRoomId, props.listPreviewsByRoomId]);

  const roomBase = props.roomHrefBase || "/mentor/question-room";

  return (
    <div className="flex h-[calc(100vh-120px)] w-full bg-white font-sans text-slate-900 overflow-hidden rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex w-full h-full overflow-hidden">
        
        {/* [좌측] 학생 질문방 목록 */}
        <aside className="w-[300px] shrink-0 border-r border-slate-100 flex flex-col h-full bg-[#fcfdfe]">
          <div className="p-6 pb-2">
            <h1 className="text-[18px] font-black text-slate-900">질문방 목록</h1>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="학생명 검색" 
                  disabled
                  className="w-full h-10 rounded-xl bg-white border border-slate-200 pl-9 pr-4 text-[12px] font-medium outline-none opacity-50 cursor-not-allowed"
                />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(["all", "waiting", "done"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                      activeTab === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t === "all" ? "전체" : t === "waiting" ? "대기" : "완료"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const id = String(room.id);
                const pv = props.listPreviewsByRoomId[id];
                const isSelected = selectedRoomId === id;
                const studentName = roomTitle(room);
                const lastMsg = pv?.lastMessage;
                const previewText = messageBodyPreview(lastMsg ?? null, 40) || "최근 대화 없음";
                
                return (
                  <button
                    key={id}
                    onClick={() => setUserSelectedRoomId(id)}
                    className={`w-full flex items-start gap-3 px-6 py-4 transition-all text-left border-b border-slate-50 relative ${
                      isSelected ? "bg-white shadow-[inset_4px_0_0_0_#2563eb]" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="shrink-0 mt-1">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[13px] font-black truncate ${isSelected ? "text-blue-600" : "text-slate-900"}`}>
                          {studentName} 학생
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 line-clamp-1">
                        {previewText}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-400 text-[12px] font-bold">질문방이 없습니다.</div>
            )}
          </div>
        </aside>

        {/* [중앙] 질문 관리 & 히스토리 */}
        <main className="flex-[1.2] flex flex-col h-full bg-white border-r border-slate-100 overflow-hidden">
          {selectedRoom ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                      <User className="h-7 w-7 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[20px] font-black text-slate-900">{roomTitle(selectedRoom)} 학생</h2>
                      </div>
                      <p className="text-[13px] font-bold text-slate-400 mt-0.5">질문방 정보</p>
                    </div>
                  </div>
                  <Link 
                    href={roomDetailPath(roomBase, String(selectedRoom.id))}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[12px] font-black rounded-xl hover:bg-slate-800 transition"
                  >
                    질문방 열기 <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      최근 질문
                    </h3>
                  </div>
                  
                  {selectedPreview?.latestThread ? (
                    <Link 
                      href={threadInRoomPath(roomBase, String(selectedRoom.id), String(selectedPreview.latestThread.id))}
                      className="block group rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-black">진행 중</span>
                      </div>
                      <h4 className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {(selectedPreview.latestThread.topic as string) || "질문 주제"}
                      </h4>
                      <p className="mt-2 text-[13px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                        {messageBodyPreview(selectedPreview.lastMessage ?? null, 100) || "내용 없음"}
                      </p>
                      <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-end">
                        <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                          상세 보기 <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/30 p-8 flex items-center justify-center">
                      <p className="text-[13px] font-bold text-slate-300 italic">등록된 질문이 없습니다.</p>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-[15px] font-black text-slate-900 flex items-center gap-2 mb-5">
                    <Bookmark className="h-4 w-4 text-blue-500" />
                    학생 메모
                  </h3>
                  <div className="rounded-[24px] bg-[#f8fafc] border border-slate-100 p-6">
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                      {extractNoteText(selectedRoom) || "상세 화면에서 학생/멘토 메모를 확인하세요."}
                    </p>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
              <RotateCcw className="h-12 w-12 text-slate-100" />
              <p className="text-[15px] font-bold">학생을 선택하여 질문을 관리하세요.</p>
            </div>
          )}
        </main>

        {/* [우측] 실시간 질문방 (Preview) */}
        <aside className="w-[350px] shrink-0 flex flex-col h-full bg-white overflow-hidden">
          <div className="flex flex-col h-full border-l border-slate-100 shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
            <header className="p-6 border-b border-slate-50 bg-white shrink-0">
               <h2 className="text-[15px] font-black text-slate-900">실시간 질문방</h2>
               <p className="text-[10px] font-bold text-slate-400 mt-1">대화 미리보기</p>
            </header>

            <div className="flex-1 overflow-y-auto p-6 bg-[#fcfdfe] custom-scrollbar">
              {selectedRoom ? (
                <div className="space-y-6">
                   {selectedPreview?.lastMessage ? (
                     <div className="flex items-start gap-2.5 max-w-[90%]">
                       <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                         <User className="h-4 w-4 text-slate-400" />
                       </div>
                       <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-slate-400 ml-1">{roomTitle(selectedRoom)}</p>
                          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                             <p className="text-[13px] font-medium leading-relaxed text-slate-700">
                               {messageBodyPreview(selectedPreview.lastMessage, 200)}
                             </p>
                          </div>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center py-10">
                       <p className="text-[12px] font-bold text-slate-300">최근 대화가 없습니다.</p>
                     </div>
                   )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                  <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-300">선택된 질문방이 없습니다.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-50 shrink-0">
               {selectedRoom ? (
                 <Link 
                   href={roomDetailPath(roomBase, String(selectedRoom.id))}
                   className="w-full h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-[14px] font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95"
                 >
                   상세 화면에서 답변하기
                 </Link>
               ) : (
                 <div className="w-full h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-[14px] font-black cursor-not-allowed">
                   질문방을 선택해주세요
                 </div>
               )}
               <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                 <Paperclip className="h-4 w-4 opacity-30" />
                 <span className="text-[10px] font-bold">첨부파일 및 상세 기능은 상세 페이지에서 제공됩니다.</span>
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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
