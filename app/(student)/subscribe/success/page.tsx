import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadStudentSubscribePage } from "@/lib/subscribe/subscribePageQueries";
import { isSubscribePlanTier } from "@/lib/subscribe/subscribePageQueries";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export default async function SubscribeSuccessPage({ searchParams }: Props) {
  const { user } = await requireRole("student");
  const sp = (await searchParams) ?? {};

  const mentorId = one(sp, "mentorId");
  const planTierRaw = one(sp, "planTier");

  if (!mentorId || !planTierRaw || !isSubscribePlanTier(planTierRaw)) {
    redirect("/subscribe?error=" + encodeURIComponent("구독 정보가 올바르지 않습니다."));
  }

  const supabase = await createClient();
  const data = await loadStudentSubscribePage(supabase, {
    mentorId,
    studentId: user.id,
  });
  const mentorName = data.kind === "ok" ? data.display.displayName : "멘토";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <section className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" strokeWidth={2.25} aria-hidden />
        <h1 className="mt-4 text-2xl font-black text-slate-900">구독이 완료되었습니다!</h1>
        <p className="mt-4 text-base font-medium text-slate-700">
          <span className="font-bold text-slate-900">{mentorName}</span>님과 함께 공부를 시작해보세요.
        </p>

        <div className="mt-8">
          <Link
            href="/question-room"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 sm:w-auto sm:min-w-[220px]"
          >
            질문방으로 이동하기
          </Link>
        </div>
      </section>
    </div>
  );
}
