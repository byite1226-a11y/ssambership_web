import type { ReactNode } from "react";

type Props = { title: string; children: ReactNode };

export function PolicyNotice(props: Props) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs leading-relaxed text-slate-700">
      <p className="font-extrabold text-slate-900">{props.title}</p>
      <div className="mt-2 space-y-2">{props.children}</div>
    </aside>
  );
}
