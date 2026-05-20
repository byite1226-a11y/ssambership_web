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
      title={"\uB0B4 \uC758\uB8B0 \uBAA9\uB85D"}
      description={"\uB4F1\uB85D\uD55C \uC758\uB8B0\uC640 \uC9C0\uC6D0 \uD604\uD669\uC744 \uD655\uC778\uD558\uC138\uC694."}
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
