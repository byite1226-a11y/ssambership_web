import Link from "next/link";
import { requireRole } from "@/lib/auth/routeGuard";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export default async function SubscribeFailPage({ searchParams }: Props) {
  await requireRole("student");
  const sp = (await searchParams) ?? {};
  const mentorId = one(sp, "mentorId");
  const message = one(sp, "message") ?? "결제가 취소되었거나 승인되지 않았습니다.";

  const retryHref = mentorId
    ? `/subscribe?mentorId=${encodeURIComponent(mentorId)}`
    : "/mentors";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-black text-slate-900">결제에 실패했습니다</h1>
        <p className="mt-3 text-sm text-red-800">{message}</p>
        <Link
          href={retryHref}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
        >
          다시 시도
        </Link>
      </section>
    </div>
  );
}
