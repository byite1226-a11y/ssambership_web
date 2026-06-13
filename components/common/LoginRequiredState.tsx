import Link from "next/link";

type Props = { nextPath: string; description?: string };

export function LoginRequiredState(props: Props) {
  const q = `/login/student?next=${encodeURIComponent(props.nextPath)}`;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
      <p className="font-extrabold text-slate-900">로그인이 필요합니다</p>
      <p className="mt-2 leading-relaxed text-slate-600">
        {props.description ?? "이 페이지는 로그인 후 이용할 수 있어요."}
      </p>
      <p className="mt-4 flex flex-wrap gap-2">
        <Link href={q} className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700">
          학생 로그인
        </Link>
        <Link href="/login/mentor" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50">
          멘토 로그인
        </Link>
      </p>
    </div>
  );
}
