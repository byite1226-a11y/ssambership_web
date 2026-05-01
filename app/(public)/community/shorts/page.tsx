import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { StateBanner } from "@/components/community/StateBanner";
import { createClient } from "@/lib/supabase/server";
import { listShortformPosts, pickExcerpt, pickTitle } from "@/lib/community/communityQueries";

export default async function CommunityShortsPage() {
  const supabase = await createClient();
  const { rows, error } = await listShortformPosts(supabase, 30);
  if (error) {
    console.error("[community/shorts] listShortformPosts", error);
  }

  return (
    <PageScaffold
      eyebrow="숏폼"
      title="짧은 소식·인사이트"
      description="짧게 올라온 글만 모았어요. 카드에서 제목과 요약을 보고, 상세로 들어가 전체를 읽을 수 있습니다."
      ctas={[
        { href: "/question-room", label: "질문하기", tone: "blue" },
        { href: "/community/board", label: "게시판", tone: "slate" },
        { href: "/community", label: "커뮤니티 홈", tone: "slate" },
        { href: "/mentor/community/new", label: "멘토 글쓰기", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
    >
      {error ? (
        <div className="mb-4">
          <StateBanner kind="error" message="숏폼 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
        </div>
      ) : null}
      {!error && rows.length === 0 ? (
        <StateBanner kind="empty" message="아직 등록된 숏폼이 없습니다. 멘토 글쓰기로 새 소식을 남기거나 게시판을 둘러보세요." />
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => (
          <li
            key={typeof r.id === "string" ? r.id : `sf-${i}`}
            className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-extrabold text-slate-900">{pickTitle(r)}</h2>
            <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-600">
              {pickExcerpt(r) || "요약이 곧 표시돼요."}
            </p>
            {typeof r.id === "string" ? (
              <Link
                className="mt-4 inline-flex w-full justify-center rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                href={`/community/shorts/${r.id}`}
              >
                자세히 보기
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </PageScaffold>
  );
}
