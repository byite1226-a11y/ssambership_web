import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
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
    <CommunityLayoutShell
      activeNav="none"
      hero={
        <CommunityPageHero
          eyebrow="멘토 · 커뮤니티 · 새 글"
          title="커뮤니티 작성"
          description="멘토 전용입니다. 게시판 글과 숏폼 소식 중 하나를 선택해 등록합니다. 저장 후 목록·상세로 이동하며, 출처 표기와 권리 확인에 동의해야 제출할 수 있습니다. 질문방·캐시와는 별도입니다."
          ctas={[
            { href: "/community/shortform", label: "숏폼 보기", tone: "slate" },
            { href: "/community/board", label: "게시판 보기", tone: "slate" },
            { href: "/community", label: "커뮤니티 홈", tone: "slate" },
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <MentorCommunityComposeForm errorMessage={errorMessage} />
      </div>
    </CommunityLayoutShell>
  );
}
