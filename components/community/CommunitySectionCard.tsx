import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  children: ReactNode;
};

export function CommunitySectionCard(props: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-slate-900">{props.title}</h2>
          {props.subtitle ? <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{props.subtitle}</p> : null}
        </div>
        {props.action ? (
          <Link href={props.action.href} className="shrink-0 text-sm font-bold text-blue-700 hover:underline">
            {props.action.label}
          </Link>
        ) : null}
      </div>
      <div className="pt-4">{props.children}</div>
    </section>
  );
}
