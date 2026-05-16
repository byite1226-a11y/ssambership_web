import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, k: string): string | null {
  const v = sp[k];
  if (Array.isArray(v)) return v[0] ?? null;
  return typeof v === "string" && v.length ? v : null;
}

export default async function SubscribeSuccessPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const mentorId = one(sp, "mentorId");
  const subscriptionHint = one(sp, "subscriptionId") ?? one(sp, "sub");

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="구독·결제"
      title="결제가 완료된 것으로 표시됩니다"
      description="실제 승인·구독 행 생성은 PG·웹훅·DB 상태에 따라 달라질 수 있어요. 아래 링크에서 질문방·구독 현황을 확인해 주세요."
      ctas={[
        { href: "/question-room", label: "질문방으로", tone: "blue" },
        { href: "/subscriptions", label: "구독 관리", tone: "slate" },
        { href: "/home", label: "학생 홈", tone: "slate" },
      ]}
      sections={[
        {
          title: "쿼리 파라미터",
          body:
            mentorId || subscriptionHint
              ? `mentorId=${mentorId ?? "—"} · subscription/ref=${subscriptionHint ?? "—"}`
              : "URL에 mentorId·subscription 식별자가 없으면, 목록 화면에서 상태를 확인해 주세요.",
          status: "connected",
        },
        {
          title: "질문방 생성",
          body: "구독 직후 질문방(room) 생성이 지연될 수 있어요. 목록에 방이 보이지 않으면 구독 화면과 알림을 확인해 주세요.",
          status: "skeleton",
        },
      ]}
      dataPoints={["subscriptions", "mentor_student_rooms", "payments (schema-dependent)"]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
        <p className="font-extrabold text-slate-900">다음 단계</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-600">
          <li>질문 주제는 학생이 질문방에서 새로 만듭니다.</li>
          <li>캐시 충전·원장은 맞춤의뢰 대금과 별도 메뉴입니다.</li>
        </ul>
        {mentorId ? (
          <p className="mt-4 text-xs text-slate-500">
            멘토 식별자는 URL에서만 표시됩니다.{" "}
            <Link className="font-bold text-blue-700 underline" href={`/mentors/${encodeURIComponent(mentorId)}`}>
              멘토 공개 프로필
            </Link>
          </p>
        ) : null}
      </div>
    </PageScaffold>
  );
}
