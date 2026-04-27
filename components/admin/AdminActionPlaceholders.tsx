/** 승인/반려, 숨김 등 — server action 연결 전 */
export function AdminApproveRejectRow() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
      <button
        type="button"
        disabled
        className="rounded-lg bg-emerald-600/40 px-3 py-1.5 text-sm font-bold text-white cursor-not-allowed"
        title="다음: server action + RLS"
      >
        승인
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-red-600/40 px-3 py-1.5 text-sm font-bold text-white cursor-not-allowed"
        title="다음: server action + RLS"
      >
        반려
      </button>
      <span className="text-xs text-slate-500">admin action (연결 예정)</span>
    </div>
  );
}

export function AdminModerationPlaceholders() {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled className="rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 cursor-not-allowed">
        숨김
      </button>
      <button type="button" disabled className="rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 cursor-not-allowed">
        블라인드
      </button>
      <span className="text-xs text-slate-500">moderation action (연결 예정)</span>
    </div>
  );
}

export function AdminFilterSlot() {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-500">
      <input disabled placeholder="도메인(결제/신고/권한) 필터" className="rounded border border-slate-200 bg-white px-2 py-1.5" />
      <input disabled placeholder="기간" className="rounded border border-slate-200 bg-white px-2 py-1.5" />
      <span className="self-center text-xs">필터 쿼리(후속)</span>
    </div>
  );
}

export function AdminDetailPanelSlot() {
  return (
    <aside className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-600">
      <h3 className="font-extrabold text-slate-800">상세 패널 자리</h3>
      <p className="mt-1">행 선택 → /admin/.../[id] 및 Server Component (후속)</p>
    </aside>
  );
}
