type Props = { label?: string };

export function LoadingState(props: Props) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm font-semibold text-slate-600">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden />
      {props.label ?? "불러오는 중입니다."}
    </div>
  );
}
