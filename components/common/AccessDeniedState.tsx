import Link from "next/link";

type Props = { message: string; homeHref?: string; homeLabel?: string };

export function AccessDeniedState(props: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
      <p className="font-extrabold text-slate-900">접근이 제한되었습니다</p>
      <p className="mt-2 leading-relaxed">{props.message}</p>
      {props.homeHref ? (
        <p className="mt-4">
          <Link href={props.homeHref} className="font-bold text-blue-700 underline underline-offset-2 hover:text-blue-900">
            {props.homeLabel ?? "홈으로"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
