type Props = {
  disabled: boolean;
  disabledReason: string;
};

export function ReviewWritePanel(props: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-extrabold text-slate-900">리뷰 작성</p>
      <form className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-600" htmlFor="rv-rating">
            별점
          </label>
          <select
            id="rv-rating"
            name="rating"
            disabled={props.disabled}
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:cursor-not-allowed"
            defaultValue="5"
          >
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600" htmlFor="rv-body">
            후기
          </label>
          <textarea
            id="rv-body"
            name="body"
            rows={4}
            disabled={props.disabled}
            placeholder="백엔드 저장 액션이 연결되면 제출할 수 있어요."
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-slate-200 py-2 text-sm font-extrabold text-slate-500 cursor-not-allowed"
          title={props.disabledReason}
        >
          제출 (비활성화)
        </button>
        <p className="text-xs font-medium text-slate-500">{props.disabledReason}</p>
      </form>
    </div>
  );
}
