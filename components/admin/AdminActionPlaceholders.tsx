export function AdminApproveRejectRow() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
      <button
        type="button"
        disabled
        className="rounded-lg bg-emerald-600/40 px-3 py-1.5 text-sm font-bold text-white cursor-not-allowed"
        title="승인 기능 준비 중"
      >
        승인 기능 준비 중
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-red-600/40 px-3 py-1.5 text-sm font-bold text-white cursor-not-allowed"
        title="반려 기능 준비 중"
      >
        반려 기능 준비 중
      </button>
      <span className="text-xs text-slate-500">버튼 연결 후 사용할 수 있습니다.</span>
    </div>
  );
}

export function AdminModerationPlaceholders() {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled className="rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 cursor-not-allowed" title="숨김 처리 준비 중">
        숨김 처리 준비 중
      </button>
      <button type="button" disabled className="rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 cursor-not-allowed" title="블라인드 준비 중">
        블라인드 준비 중
      </button>
      <span className="text-xs text-slate-500">조치 기능은 준비 중입니다.</span>
    </div>
  );
}

export function AdminFilterSlot() {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-500">
      <input disabled placeholder="검색어" className="rounded border border-slate-200 bg-white px-2 py-1.5" />
      <input disabled placeholder="기간" className="rounded border border-slate-200 bg-white px-2 py-1.5" />
      <span className="self-center text-xs">필터 기능 준비 중</span>
    </div>
  );
}

export function AdminDetailPanelSlot() {
  return (
    <aside className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-600">
      <h3 className="font-extrabold text-slate-800">상세 패널 준비 중</h3>
      <p className="mt-1">행을 선택하면 상세 화면에서 추가 정보를 확인할 수 있도록 연결할 예정입니다.</p>
    </aside>
  );
}
