import { redirect } from "next/navigation";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { loadStudentMypageBundle } from "@/lib/mypage/mypageQueries";
import { loadWalletLedgerPageData } from "@/lib/cash/walletRouteData";
import { StudentDashboardShell } from "@/components/mypage/StudentDashboardShell";
import { Suspense } from "react";
import { WalletLedgerPageBody } from "@/components/cash/WalletLedgerPageBody";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function WalletLedgerPage(props: Props) {
  const { user, profile, error: profileLoadError } = await getServerUserWithProfile();
  if (profile?.role === "mentor") {
    redirect("/wallet/charge");
  }
  if (!user) {
    redirect(`/login/student?next=${encodeURIComponent("/wallet/ledger")}`);
  }

  const supabase = await createClient();
  const sp = (await props.searchParams) ?? {};
  const from = (Array.isArray(sp.from) ? sp.from[0] : sp.from) ?? null;
  const to = (Array.isArray(sp.to) ? sp.to[0] : sp.to) ?? null;
  const kind = (Array.isArray(sp.kind) ? sp.kind[0] : sp.kind) ?? null;

  const bundle = await loadStudentMypageBundle(
    supabase,
    user.id,
    profile,
    profileLoadError?.message ?? null
  );

  const data = await loadWalletLedgerPageData(supabase, user.id, {
    from: from ?? undefined,
    to: to ?? undefined,
    kind: kind ?? undefined
  });

  return (
    <StudentDashboardShell
      activeTab="wallet"
      user={user}
      profile={profile}
      profileLoadError={profileLoadError?.message ?? null}
      bundle={bundle}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">캐시 사용내역</h1>
          <p className="mt-1 text-sm text-slate-500">충전·구독·맞춤의뢰 등 캐시 흐름을 확인합니다.</p>
        </header>

        <Suspense fallback={<p className="text-sm text-slate-500">불러오는 중…</p>}>
          <WalletLedgerPageBody data={data} />
        </Suspense>
      </div>
    </StudentDashboardShell>
  );
}
