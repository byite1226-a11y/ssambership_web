type Props = { queryHint?: string };

export function SearchEmptyState(props: Props) {
  return (
    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-600">
      조건에 맞는 결과가 없습니다.
      {props.queryHint ? <span className="mt-1 block text-slate-500">{props.queryHint}</span> : null}
    </p>
  );
}
