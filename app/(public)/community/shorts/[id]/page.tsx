import { PageScaffold } from "@/components/shell/PageScaffold";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";
import { createClient } from "@/lib/supabase/server";
import { getShortformPost, pickTitle } from "@/lib/community/communityQueries";

type Props = { params: Promise<{ id: string }> };

export default async function CommunityShortDetailPage(props: Props) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { row, error } = await getShortformPost(supabase, id);

  return (
    <PageScaffold
      eyebrow="커뮤니티 · 숏폼"
      title="숏폼"
      description="짧은 영상과 함께 읽는 커뮤니티 글이에요."
      ctas={[
        { href: "/community/shorts", label: "목록", tone: "slate" },
        { href: "/community", label: "홈", tone: "slate" },
      ]}
      sections={[
        { title: "콘텐츠", body: "본문·동영상·작성자 정보", status: row ? "connected" : "skeleton" },
        { title: "소통", body: "댓글·반응·신고는 순차 지원됩니다.", status: "skeleton" },
      ]}
      emptyState="이 콘텐츠가 아직 없거나, 볼 수 없을 수 있어요."
      loadingState="불러오는 중이에요."
      errorState="다시 시도하거나, 목록에서 다른 콘텐츠를 둘러봐 주세요."
      dataPoints={[]}
    >
      <CommunityPostDetail
        variant="shortform"
        title={row ? pickTitle(row) : "숏폼"}
        row={row}
        error={error}
        backHref="/community/shorts"
        listLabel="숏폼 목록"
      />
    </PageScaffold>
  );
}
