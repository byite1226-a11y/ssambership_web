import Link from "next/link";
import { pickExcerpt, pickTitle } from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

export function CommunityPreviewSection(props: {
  shorts: { rows: Row[]; table: string | null; error: string | null };
  boards: { rows: Row[]; table: string | null; error: string | null };
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-extrabold text-slate-900">커뮤니티 미리보기</h2>
      <p className="mt-1 text-xs text-slate-500">숏폼과 게시판에서 올라온 글을 함께 보여 드려요.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800">숏폼</h3>
            <Link href="/community/shortform" className="text-xs font-bold text-blue-700 underline">
              더보기
            </Link>
          </div>
          {props.shorts.error ? (
            <p className="mt-2 text-sm text-slate-600">목록을 불러오지 못했습니다.</p>
          ) : props.shorts.rows.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">아직 표시할 숏폼이 없습니다.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {props.shorts.rows.map((r, i) => (
                <li key={String((r as { id?: string }).id ?? i)} className="text-sm text-slate-800">
                  <span className="font-bold">{pickTitle(r)}</span>
                  <p className="line-clamp-2 text-xs text-slate-500">{pickExcerpt(r)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800">게시판</h3>
            <Link href="/community/board" className="text-xs font-bold text-blue-700 underline">
              더보기
            </Link>
          </div>
          {props.boards.error ? (
            <p className="mt-2 text-sm text-slate-600">목록을 불러오지 못했습니다.</p>
          ) : props.boards.rows.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">아직 표시할 게시글이 없습니다.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {props.boards.rows.map((r, i) => (
                <li key={String((r as { id?: string }).id ?? i)} className="text-sm text-slate-800">
                  <span className="font-bold">{pickTitle(r)}</span>
                  <p className="line-clamp-2 text-xs text-slate-500">{pickExcerpt(r)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        <Link href="/community" className="font-bold text-blue-700 underline">
          커뮤니티 허브
        </Link>
      </p>
    </section>
  );
}
