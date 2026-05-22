import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestNewForm } from "@/components/customRequest/CustomRequestNewForm";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";

type PageProps = { searchParams?: Promise<{ error?: string }> };

export default async function CustomRequestNewPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const err = typeof sp.error === "string" && sp.error.length ? sp.error : null;
  const errUi = err ? mapDataErrorMessage(err) : null;

  return (
    <PageScaffold
      compactHero
      hideHero
      eyebrow="맞춤의뢰"
      title="의뢰 등록하기"
      description="요청 내용을 작성하고 필요한 자료를 첨부해 주세요. 멘토 지원을 받은 뒤 주문 확정, 결제 안내, 납품은 단계별로 진행됩니다."
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰 소개", tone: "slate" },
        { href: "/home", label: "학생 홈", tone: "slate" },
      ]}
      sections={[]}
      hideFooterPlaceholderCards
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-0">
        <CustomRequestNewForm errorMessage={errUi} />
      </div>
    </PageScaffold>
  );
}
