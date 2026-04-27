import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestNewForm } from "@/components/customRequest/CustomRequestNewForm";
import { CUSTOM_REQUEST_DATA_MODEL } from "@/lib/customRequest/customRequestDataModel";

type PageProps = { searchParams?: Promise<{ error?: string }> };

export default async function CustomRequestNewPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const err = typeof sp.error === "string" && sp.error.length ? sp.error : null;

  return (
    <PageScaffold
      eyebrow="Student / Custom request / New"
      title="의뢰 등록"
      description="custom_request_posts insert (컬럼 후보) + 필수 동의. 첨부·결제는 후속. 질문방·캐시·마이페이지·관리자는 변경 없음."
      ctas={[
        { href: "/custom-request", label: "맞춤의뢰 소개", tone: "slate" },
        { href: "/home", label: "학생 홈", tone: "slate" },
      ]}
      sections={[
        { title: "검증", body: "submitCustomRequestNew + requireRole(student).", status: "connected" },
        { title: "첨부", body: "Storage(연결 예정).", status: "skeleton" },
      ]}
      emptyState="—"
      dataPoints={[...CUSTOM_REQUEST_DATA_MODEL]}
    >
      <CustomRequestNewForm errorMessage={err} />
    </PageScaffold>
  );
}
