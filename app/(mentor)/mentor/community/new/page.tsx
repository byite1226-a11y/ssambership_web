import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorCommunityComposeForm } from "@/components/community/MentorCommunityComposeForm";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const MENTOR_COMPOSE_ERROR_MESSAGES: Record<string, string> = {
  invalid_target: "작성 대상(게시판 / 숏폼)을 선택해 주세요.",
  validation_fields: "제목과 본문을 입력해 주세요.",
  validation_source: "출처를 입력해 주세요.",
  validation_rights: "권리·정당한 이용 확인에 동의해 주세요.",
  shortform_save: "숏폼 글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  board_save: "게시판 글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

function mentorComposeErrorDisplay(code: string | null): string | null {
  if (!code || !code.trim()) return null;
  const key = code.trim();
  return MENTOR_COMPOSE_ERROR_MESSAGES[key] ?? "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export default async function MentorCommunityNewPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const rawCode = typeof sp.error === "string" && sp.error.length ? sp.error.trim() : null;
  const errorMessage = mentorComposeErrorDisplay(rawCode);

  return (
    <PageScaffold
      eyebrow="멘토 / 커뮤니티 / 새 글"
      title="커뮤니티 작성"
      description="멘토 전용입니다. 게시판 글과 숏폼 소식 중 하나를 선택해 등록합니다. 질문방·캐시 기능과는 별도입니다."
      ctas={[
        { href: "/community/shorts", label: "숏폼 보기", tone: "slate" },
        { href: "/community/board", label: "게시판 보기", tone: "slate" },
        { href: "/mentor/dashboard", label: "대시보드", tone: "slate" },
      ]}
      sections={[
        { title: "제출", body: "선택한 종류에 맞게 저장되며, 저장 후 해당 목록·상세 화면으로 이동합니다.", status: "connected" },
        { title: "권한", body: "멘토 계정으로만 작성할 수 있습니다.", status: "connected" },
        { title: "권리·출처", body: "출처 표기와 권리 확인 동의가 필요합니다.", status: "connected" },
        { title: "검수", body: "운영 검수·신고 처리는 관리자 메뉴에서 별도로 진행됩니다.", status: "skeleton" },
      ]}
      emptyState="—"
      loadingState="—"
      errorState="—"
      dataPoints={[
        "게시판과 숏폼 중 하나를 선택해 저장합니다.",
        "출처 표기와 권리 확인에 동의해야 제출할 수 있습니다.",
      ]}
    >
      <MentorCommunityComposeForm errorMessage={errorMessage} />
    </PageScaffold>
  );
}
