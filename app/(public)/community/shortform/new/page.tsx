import { redirect } from "next/navigation";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityShortformUploadForm } from "@/components/community/CommunityShortformUploadForm";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityShortformNewPage(props: Props) {
  const { user, profile } = await getServerUserWithProfile();
  if (!user) redirect(`/login?next=${encodeURIComponent("/community/shortform/new")}`);
  if (profile?.role !== "mentor") redirect("/community/shortform?error=mentor_only");

  const sp = (await props.searchParams) ?? {};
  const errorCode = typeof sp.error === "string" ? sp.error : null;
  const draftSaved = sp.draft === "1";

  return (
    <CommunityLayoutShell activeNav="shortform" rightAsidePromo="shortform">
      <header className="mb-4">
        <h1 className="text-xl font-black text-slate-900">{"\uC877\uD3FC \uC5C5\uB85C\uB4DC"}</h1>
        <p className="mt-1 text-sm text-slate-600">{"\uBA58\uD1A0 \uACC4\uC815\uC73C\uB85C \uC601\uC0C1\uC744 \uB4F1\uB85D\uD569\uB2C8\uB2E4."}</p>
      </header>
      <CommunityShortformUploadForm errorCode={errorCode} draftSaved={draftSaved} />
    </CommunityLayoutShell>
  );
}
