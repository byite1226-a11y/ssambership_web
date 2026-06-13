import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function EmptyState(props: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
      <p className="text-sm font-extrabold text-slate-900">{props.title}</p>
      {props.description ? <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">{props.description}</p> : null}
      {props.children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{props.children}</div> : null}
    </div>
  );
}
