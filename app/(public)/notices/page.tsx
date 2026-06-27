import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { PublicNoticesList } from "@/components/notices/PublicNoticesList";
import { loadPublicNotices } from "@/lib/notices/publicNoticesQueries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "공지사항",
  description: "쌤버십 서비스 공지와 점검·이벤트 안내를 확인하세요.",
};

export default async function PublicNoticesPage() {
  const supabase = await createClient();
  const { items, error, accessDenied } = await loadPublicNotices(supabase, 50);

  if (error) {
    console.error("[notices] loadPublicNotices", error);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#2563EB]">고객 지원</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">공지사항</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          서비스 점검, 업데이트, 이벤트 등 공식 안내를 모아 둡니다.
        </p>
      </header>

      {accessDenied ? (
        <EmptyState
          title="공지를 불러올 수 없습니다"
          description="현재 공지 데이터 조회 권한을 확인 중입니다. 잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState title="등록된 공지가 없습니다" description="새 공지가 등록되면 이곳에 표시됩니다." />
      ) : (
        <PublicNoticesList items={items} />
      )}

      <p className="text-center text-sm text-slate-600">
        <Link href="/support" className="font-bold text-[#2563EB] hover:underline">
          자주 묻는 질문 · 고객센터
        </Link>
        {" "}로 이동
      </p>
    </div>
  );
}
