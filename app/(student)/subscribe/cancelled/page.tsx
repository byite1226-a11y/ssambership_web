import Link from "next/link";
import { XCircle } from "lucide-react";

export default function SubscribeCancelledPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <XCircle className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">결제를 취소했어요</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        결제 창을 닫았거나 결제를 취소했어요. 캐시는 차감되지 않았으니 안심하세요. 언제든 다시 구독할 수 있어요.
      </p>
      <div className="mt-7 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Link
          href="/subscribe"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700"
        >
          요금제로 돌아가기
        </Link>
        <Link
          href="/mentors"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
        >
          멘토 찾기
        </Link>
      </div>
    </div>
  );
}
