type Props = { disabledReason: string };

export function ReviewReportButton(props: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <p className="font-extrabold text-slate-900">리뷰 신고</p>
      <p className="mt-1">{props.disabledReason}</p>
      <button type="button" disabled className="mt-2 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 cursor-not-allowed">
        신고 접수 (비활성화)
      </button>
    </div>
  );
}
