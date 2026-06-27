"use client";

import type { ReactNode } from "react";

type Props = {
  title?: string;
  count?: number;
  filters?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminDataTable(props: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {(props.title || props.filters) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            {props.title ? <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">{props.title}</h2> : null}
            {props.count != null ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#2563EB]">{props.count}건</span>
            ) : null}
          </div>
          {props.filters}
        </div>
      )}
      <div className="overflow-x-auto">{props.children}</div>
      {props.footer ? <div className="border-t border-slate-100 px-5 py-3">{props.footer}</div> : null}
    </section>
  );
}
