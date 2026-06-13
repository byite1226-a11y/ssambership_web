import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestStudentPostsList } from "@/components/customRequest/CustomRequestStudentPostsList";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadStudentCustomRequestPosts } from "@/lib/customRequest/customRequestQueries";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import type { StudentPostListFilter } from "@/lib/customRequest/studentPostDisplay";

type PageProps = { searchParams?: Promise<{ draft?: string; deleted?: string; error?: string }> };

export default async function CustomRequestStudentPostsPage(props: PageProps) {
  const { user, profile } = await getServerUserWithProfile();
  if (!user) redirect(`/login/student?next=${encodeURIComponent("/custom-request/posts")}`);
  if (profile?.role === "mentor") redirect("/mentor/custom-request/posts");

  const sp = (await props.searchParams) ?? {};
  const initialFilter: StudentPostListFilter | undefined = sp.draft === "1" ? "draft" : undefined;
  const err = typeof sp.error === "string" && sp.error ? sp.error : null;

  const supabase = await createClient();
  const list = await loadStudentCustomRequestPosts(supabase, user.id, 50);

  return (
    <PageScaffold
      compactHero
      hideHero
      hideFooterPlaceholderCards
      eyebrow={"\uB9DE\uCDA4\uC758\uB8B0"}
      title="내 의뢰 목록"
      description="등록한 의뢰와 지원 현황을 확인하고, 마감·예산·상태별로 살펴보세요."
      ctas={[
        { href: "/custom-request/new", label: "\uC758\uB8B0\uD558\uAE30", tone: "blue" },
        { href: "/custom-request", label: "\uBA54\uC778", tone: "slate" },
      ]}
      sections={[]}
      dataPoints={[]}
      emptyState=""
    >
      {err ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50/90 px-3.5 py-2.5 text-sm font-extrabold text-red-900">
          {mapDataErrorMessage(err)}
        </p>
      ) : null}
      {sp.deleted === "1" ? (
        <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/90 px-3.5 py-2.5 text-sm font-extrabold text-emerald-900">
          임시저장 글을 삭제했어요.
        </p>
      ) : null}
      <CustomRequestStudentPostsList rows={list.rows} initialFilter={initialFilter} />
    </PageScaffold>
  );
}
