import Link from "next/link";
import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestStudentPostsList } from "@/components/customRequest/CustomRequestStudentPostsList";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadStudentCustomRequestPosts } from "@/lib/customRequest/customRequestQueries";

export default async function CustomRequestStudentPostsPage() {
  const { user, profile } = await getServerUserWithProfile();
  if (!user) redirect(`/login/student?next=${encodeURIComponent("/custom-request/posts")}`);
  if (profile?.role === "mentor") redirect("/mentor/custom-request/posts");

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
      <CustomRequestStudentPostsList rows={list.rows} />
    </PageScaffold>
  );
}
