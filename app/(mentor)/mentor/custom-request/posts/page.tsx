import Link from "next/link";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { MentorOpenPostListSection } from "@/components/customRequest/MentorOpenPostListSection";
import { MentorAppliedListSection } from "@/components/customRequest/MentorAppliedListSection";
import { MentorCustomRequestPostsFilterPanel } from "@/components/customRequest/MentorCustomRequestPostsFilterPanel";
import { MentorCustomRequestWorkspaceLayout } from "@/components/customRequest/MentorCustomRequestWorkspaceLayout";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { loadMentorRecentApplicationsWithPostHints, loadOpenCustomRequestPostsForMentorBrowse, pickDisplayField } from "@/lib/customRequest/customRequestQueries";
import { fetchMentorWorkspaceCounts } from "@/lib/customRequest/mentorCounts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Category tabs matching reference image req_10
const CATEGORY_TABS = [
  { id: "all", label: "전체" },
  { id: "study", label: "공부/과제" },
  { id: "career", label: "진로/입시" },
  { id: "essay", label: "자기소개서" },
  { id: "other", label: "기타" },
];

function getCategoryId(row: Record<string, unknown>): string {
  const cat = pickDisplayField(row, ["category_label", "category", "category_name", "subject_area"]);
  if (cat === "—") return "other";
  const lower = cat.toLowerCase();
  if (lower.includes("공부") || lower.includes("과제") || lower.includes("수학") || lower.includes("영어") || lower.includes("학습")) return "study";
  if (lower.includes("진로") || lower.includes("입시") || lower.includes("진학") || lower.includes("상담")) return "career";
  if (lower.includes("자기소개서") || lower.includes("자소서") || lower.includes("essay")) return "essay";
  return "other";
}

export default async function MentorCustomRequestPostsPage(props: PageProps) {
  const { user } = await requireRole("mentor");
  const supabase = await createClient();
  const sp = (await props.searchParams) ?? {};
  const currentTab = typeof sp.tab === "string" ? sp.tab : "open";
  const categoryTab = typeof sp.cat === "string" ? sp.cat : "all";

  const [openList, applied, counts] = await Promise.all([
    loadOpenCustomRequestPostsForMentorBrowse(supabase, 50),
    loadMentorRecentApplicationsWithPostHints(supabase, user.id, 25),
    fetchMentorWorkspaceCounts(supabase, user.id),
  ]);

  const appliedPostIds = new Set(
    (applied.items ?? []).map((item) => String(item.postId || "").trim())
  );

  const filteredOpenRows = (openList.rows ?? []).filter((row) => {
    const id = String(row.id ?? "").trim();
    return id && !appliedPostIds.has(id);
  });

  // Compute per-category counts
  const categoryCounts: Record<string, number> = { all: filteredOpenRows.length };
  for (const row of filteredOpenRows) {
    const catId = getCategoryId(row);
    categoryCounts[catId] = (categoryCounts[catId] ?? 0) + 1;
  }

  // Filter by category
  const categoryFilteredRows = categoryTab === "all"
    ? filteredOpenRows
    : filteredOpenRows.filter((row) => getCategoryId(row) === categoryTab);

  const isApplied = currentTab === "applied";
  const titleText = isApplied ? "제안한 의뢰" : "새 의뢰 목록";
  const descriptionText = isApplied
    ? "내가 지원서를 보내고 매칭 결과를 기다리는 의뢰 목록입니다."
    : "학생이 작성한 새로운 의뢰입니다. 관심 있는 의뢰에 제안서를 보내보세요.";

  return (
    <PageScaffold
      compactHero
      hideFooterPlaceholderCards
      eyebrow="멘토 · 맞춤의뢰"
      title={titleText}
      description={descriptionText}
      ctas={[]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
      hideHero={true}
    >
      <MentorCustomRequestWorkspaceLayout active="posts" tab={isApplied ? "applied" : "open"} counts={counts}>
        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-[24px] font-black tracking-tight text-slate-900">{titleText}</h1>
          <p className="mt-1 text-[14px] text-slate-500">{descriptionText}</p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
          {/* Main content */}
          <div className="min-w-0 lg:col-span-8">
            {!isApplied ? (
              <>
                {/* Category Tabs + Filter button row — matching req_10 */}
                <div className="mb-5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1">
                    {CATEGORY_TABS.map((catTab) => {
                      const isActive = categoryTab === catTab.id;
                      const count = categoryCounts[catTab.id] ?? 0;
                      return (
                        <Link
                          key={catTab.id}
                          href={`/mentor/custom-request/posts${catTab.id === "all" ? "" : `?cat=${catTab.id}`}`}
                          className={[
                            "flex shrink-0 items-center gap-1.5 border-b-2 px-4 pb-3 pt-1 text-[14px] font-semibold transition-colors whitespace-nowrap",
                            isActive
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-slate-500 hover:text-slate-800",
                          ].join(" ")}
                        >
                          {catTab.label}
                          <span
                            className={[
                              "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-black",
                              isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                            ].join(" ")}
                          >
                            {count}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  {/* Filter button */}
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition mb-3"
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 4a1 1 0 011-1h10a1 1 0 010 2H7a1 1 0 01-1-1zm3 4a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
                    </svg>
                    의뢰 필터
                  </button>
                </div>

                <section className="space-y-3">
                  <h2 className="sr-only">모집 중인 맞춤의뢰</h2>
                  <MentorOpenPostListSection rows={categoryFilteredRows} listStatus={openList.status} />
                </section>
              </>
            ) : (
              <>
                <div className="mb-5">
                  {/* Applied tab header */}
                  <div className="border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-blue-600 border-b-2 border-blue-600 pb-2 px-1">
                        제안한 의뢰
                        <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[11px] font-black text-blue-700">
                          {applied.items.length}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <section className="space-y-3">
                  <h2 className="sr-only">내가 지원한 의뢰</h2>
                  <MentorAppliedListSection items={applied.items} listFailed={applied.listFailed} />
                </section>
              </>
            )}

            <p className="mt-8 text-center text-xs text-slate-400">
              <Link href="/custom-request" className="font-semibold text-blue-800 underline-offset-2 hover:underline">
                맞춤의뢰 소개 보기
              </Link>
            </p>
          </div>

          {/* Right filter panel */}
          <div className="mt-6 min-w-0 lg:col-span-4 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <MentorCustomRequestPostsFilterPanel />
            </div>
          </div>
        </div>
      </MentorCustomRequestWorkspaceLayout>
    </PageScaffold>
  );
}
