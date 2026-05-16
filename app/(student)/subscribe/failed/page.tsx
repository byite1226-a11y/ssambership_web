import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function one(sp: Record<string, string | string[] | undefined>, k: string): string | null {
  const v = sp[k];
  if (Array.isArray(v)) return v[0] ?? null;
  return typeof v === "string" && v.length ? v : null;
}

export default async function SubscribeFailedPage(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const reason = one(sp, "reason") ?? one(sp, "message");

  return (
    <PageScaffold
      hideFooterPlaceholderCards
      eyebrow="구독·결제"
      title="결제가 완료되지 않았습니다"
      description={reason ? `PG·브라우저에서 전달된 메시지: ${reason}` : "사유 코드가 URL에 없으면 결제 수단·한도를 확인한 뒤 다시 시도해 주세요."}
      ctas={[
        { href: "/subscribe", label: "구독·결제 다시 시도", tone: "blue" },
        { href: "/wallet/charge", label: "캐시 충전", tone: "slate" },
        { href: "/mentors", label: "멘토 찾기", tone: "slate" },
      ]}
      sections={[
        { title: "다음 확인", body: "카드 한도·결제 비밀번호·브라우저 팝업 차단 여부를 점검해 주세요.", status: "connected" },
      ]}
      dataPoints={[]}
    >
      <p className="text-xs text-slate-500">
        환불·취소 정책은{" "}
        <Link href="/legal/refund" className="font-bold text-blue-700 underline">
          환불 정책 안내
        </Link>
        를 참고해 주세요.
      </p>
    </PageScaffold>
  );
}
