"use client";

const rows: { key: string; label: string; note: string }[] = [
  { key: "qna", label: "질문방 알림", note: "답변·스레드 관련" },
  { key: "custom", label: "맞춤의뢰 알림", note: "지원·납품·수정 요청" },
  { key: "community", label: "커뮤니티 알림", note: "댓글·검수·신고 처리" },
  { key: "billing", label: "정산·결제 알림", note: "구독·캐시·환불" },
];

export function NotificationSettingsPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-black text-slate-900">알림 설정</h2>
      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
        채널별 on/off를 저장하는 API가 아직 연결되어 있지 않습니다. 토글은 비활성화되어 있으며, 실제 반영은 백엔드 준비 후
        활성화합니다.
      </p>
      <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
        {rows.map((r) => (
          <li key={r.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900">{r.label}</p>
              <p className="text-xs text-slate-500">{r.note}</p>
            </div>
            <button
              type="button"
              disabled
              title="알림 설정 저장 API가 연결되면 활성화됩니다."
              className="relative h-7 w-12 shrink-0 rounded-full bg-slate-200 text-left text-[10px] font-bold text-slate-500 cursor-not-allowed"
            >
              <span className="sr-only">비활성화됨</span>
              <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
