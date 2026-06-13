import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityShortformDetailView } from "@/components/community/CommunityShortformDetailView";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { createClient } from "@/lib/supabase/server";
import { isCommunityPostUuid, loadCommunityComments } from "@/lib/community/communityQueries";
import { getShortformDetail, incrementShortformView } from "@/lib/community/communityShortformQueries";
import Link from "next/link";
import { VideoOff } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function CommunityShortformDetailPage(props: Props) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { user } = await getServerUserWithProfile();
  const idOk = isCommunityPostUuid(id);

  let item = null;
  let loadError: string | null = null;
  if (idOk) {
    const res = await getShortformDetail(supabase, id);
    if (res.error) loadError = "숏폼\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
    else if (res.item) {
      item = res.item;
      await incrementShortformView(supabase, id);
    }
  }

  const { rows: comments } = item ? await loadCommunityComments(supabase, "shortform", id) : { rows: [] };
  const returnPath = `/community/shortform/${id}`;

  return (
    <CommunityLayoutShell activeNav="shortform">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loadError ? <p className="text-sm font-semibold text-red-800">{loadError}</p> : null}
        {!item && !loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <VideoOff className="h-12 w-12 text-slate-400" strokeWidth={1.5} aria-hidden />
            <h2 className="mt-4 text-xl font-black text-slate-900">숏폼을 찾을 수 없어요</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">삭제되었거나 존재하지 않는 콘텐츠예요.</p>
            <Link
              href="/community/shortform"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1A56DB] px-5 text-sm font-extrabold text-white hover:bg-[#1648c0]"
            >
              숏폼 목록으로
            </Link>
          </div>
        ) : null}
        {item ? (
          <CommunityShortformDetailView
            item={item}
            postId={id}
            returnPath={returnPath}
            comments={comments}
            canComment={user != null}
          />
        ) : null}
      </div>
    </CommunityLayoutShell>
  );
}
