import { redirect } from "next/navigation";
import { CommunityComposeForm } from "@/components/community/CommunityComposeForm";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CommunityNewPage(props: Props) {
  const { user } = await getServerUserWithProfile();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/community/new")}`);
  }

  const sp = (await props.searchParams) ?? {};
  const errorCode = typeof sp.error === "string" ? sp.error : null;
  const draftSaved = sp.draft === "1";

  return (
    <CommunityLayoutShell activeNav="none">
      <header className="mb-2">
        <h1 className="text-xl font-black text-slate-900">{"\uC0C8 \uAE00 \uC791\uC131"}</h1>
        <p className="mt-1 text-sm text-slate-600">{"\uAC8C\uC2DC\uAE00 \uB610\uB294 숏폼\uC744 \uC62C\uB824 \uACF5\uC720\uD574 \uBCF4\uC138\uC694."}</p>
      </header>
      <CommunityComposeForm errorCode={errorCode} draftSaved={draftSaved} />
    </CommunityLayoutShell>
  );
}
