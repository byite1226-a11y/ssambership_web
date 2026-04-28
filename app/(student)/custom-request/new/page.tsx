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
      eyebrow="의뢰 등록"
      title="의뢰 등록"
      description="요청 제목·내용·희망 일정을 입력하고, 멘토가 지원할 수 있게 공개합니다. 첨부·결제는 주문이 연결된 뒤 단계별로 안내됩니다."
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰 소개", tone: "slate" },
        { href: "/home", label: "학생 홈", tone: "slate" },
      ]}
      sections={[]}
    >
      <CustomRequestNewForm errorMessage={errUi} />
    </PageScaffold>
  );
}
