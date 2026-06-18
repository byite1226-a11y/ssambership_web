import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
  /** compact 가로형일 때 좌측 아이콘 타일에 넣을 아이콘 */
  icon?: ReactNode;
  /** 콤팩트 가로형: [아이콘 타일][제목+설명][행동] 한 줄, 높이 낮게 */
  compact?: boolean;
  /** compact일 때 우측 행동(버튼/링크 등). 맥락 있을 때만. */
  action?: ReactNode;
};

export function EmptyState(props: Props) {
  if (props.compact) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        {props.icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EBF1FE] text-[#1A56DB]">
            {props.icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">{props.title}</p>
          {props.description ? (
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">{props.description}</p>
          ) : null}
        </div>
        {props.action ? <div className="shrink-0">{props.action}</div> : null}
        {props.children ? <div className="shrink-0">{props.children}</div> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <p className="text-sm font-extrabold text-slate-900">{props.title}</p>
      {props.description ? <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">{props.description}</p> : null}
      {props.children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{props.children}</div> : null}
    </div>
  );
}
