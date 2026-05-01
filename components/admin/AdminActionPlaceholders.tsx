export function AdminApproveRejectRow() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
      <button
        type="button"
        disabled
        className="rounded-lg bg-emerald-600/40 px-3 py-1.5 text-sm font-bold text-white cursor-not-allowed"
        title="이 자리에서는 승인을 사용할 수 없습니다."
      >
        승인(미연결)
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-red-600/40 px-3 py-1.5 text-sm font-bold text-white cursor-not-allowed"
        title="이 자리에서는 반려를 사용할 수 없습니다."
      >
        반려(미연결)
      </button>
      <span className="text-xs text-slate-500">실제 승인·반려는 해당 업무 화면에서 처리해 주세요.</span>
    </div>
  );
}

export function AdminModerationPlaceholders() {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled className="rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 cursor-not-allowed" title="이 영역에서는 사용할 수 없습니다.">
        숨김(미연결)
      </button>
      <button type="button" disabled className="rounded-lg bg-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 cursor-not-allowed" title="이 영역에서는 사용할 수 없습니다.">
        블라인드(미연결)
      </button>
      <span className="text-xs text-slate-500">리뷰·신고 등 실제 조치는 전용 화면에서 진행해 주세요.</span>
    </div>
  );
}

export function AdminFilterSlot() {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-500">
      <input disabled placeholder="검색어" className="rounded border border-slate-200 bg-white px-2 py-1.5" />
      <input disabled placeholder="기간" className="rounded border border-slate-200 bg-white px-2 py-1.5" />
      <span className="self-center text-xs">검색·기간 필터는 아직 사용할 수 없습니다.</span>
    </div>
  );
}

export function AdminDetailPanelSlot() {
  return (
    <aside className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-600">
      <h3 className="font-extrabold text-slate-800">행별 상세</h3>
      <p className="mt-1">이 화면에서는 목록만 제공합니다. 건별 상세·추가 정보는 해당 업무 메뉴에서 열어 확인해 주세요.</p>
    </aside>
  );
}
