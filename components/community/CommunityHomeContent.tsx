import Link from "next/link";
import { CommunitySectionCard } from "@/components/community/CommunitySectionCard";
import { pickExcerpt, pickTitle } from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

type Props = {
  shortRows: Row[];
  shortFetchFailed: boolean;
  boardRows: Row[];
  boardFetchFailed: boolean;
};

function ShortRowCard({ r, i }: { r: Row; i: number }) {
  const id = typeof r.id === "string" ? r.id : null;
  return (
    <li
      key={id ?? `s-${i}`}
      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm transition hover:border-slate-300"
    >
      <p className="text-sm font-extrabold text-slate-900">{pickTitle(r)}</p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{pickExcerpt(r) || "내용을 확인해 보세요."}</p>
      {id ? (
        <Link href={`/community/shortform/${id}`} className="mt-2 inline-block text-xs font-bold text-blue-700 hover:underline">
          글 읽기
        </Link>
      ) : null}
    </li>
  );
}

function BoardRowLine({ r, i }: { r: Row; i: number }) {
  const id = typeof r.id === "string" ? r.id : null;
  return (
    <li
      key={id ?? `b-${i}`}
      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm shadow-sm"
    >
      <div className="min-w-0">
        {typeof r.category === "string" ? (
          <span className="text-xs font-bold text-slate-500">[{r.category}] </span>
        ) : null}
        <span className="font-extrabold text-slate-900">{pickTitle(r)}</span>
      </div>
      {id ? (
        <Link href={`/community/board/${id}`} className="shrink-0 text-xs font-bold text-blue-700 hover:underline">
          읽기
        </Link>
      ) : null}
    </li>
  );
}

export function CommunityHomeContent(props: Props) {
  const { shortRows, shortFetchFailed, boardRows, boardFetchFailed } = props;
  const popularBoard = boardRows.slice(0, 5);
  const weeklyBoard = boardRows.slice(5, 13);

  return (
    <div className="space-y-6">
      <CommunitySectionCard title="추천 숏폼" action={{ href: "/community/shortform", label: "전체 보기" }}>
        {shortFetchFailed ? (
          <p className="text-sm text-slate-600">숏폼을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : shortRows.length === 0 ? (
          <p className="text-sm text-slate-600">아직 등록된 숏폼이 없습니다.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortRows.slice(0, 6).map((r, i) => (
              <ShortRowCard key={typeof r.id === "string" ? r.id : `sr-${i}`} r={r} i={i} />
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <CommunitySectionCard title="인기 게시글" action={{ href: "/community/board", label: "게시판으로" }}>
        {boardFetchFailed ? (
          <p className="text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : popularBoard.length === 0 ? (
          <p className="text-sm text-slate-600">표시할 게시글이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {popularBoard.map((r, i) => (
              <BoardRowLine key={typeof r.id === "string" ? r.id : `p-${i}`} r={r} i={i} />
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <CommunitySectionCard title="이번 주 게시판" action={{ href: "/community/board", label: "전체 보기" }}>
        {boardFetchFailed ? (
          <p className="text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : weeklyBoard.length === 0 ? (
          <p className="text-sm text-slate-600">더 많은 글은 게시판에서 확인해 주세요.</p>
        ) : (
          <ul className="space-y-2">
            {weeklyBoard.map((r, i) => (
              <BoardRowLine key={typeof r.id === "string" ? r.id : `w-${i}`} r={r} i={i} />
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/question-room"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          질문하기
        </Link>
        <Link
          href="/mentor/community/new"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:border-slate-300"
        >
          멘토 · 글쓰기
        </Link>
        <Link
          href="/community/shortform"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:border-slate-300"
        >
          숏폼 피드
        </Link>
        <Link
          href="/mentor/question-room"
          className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-900 shadow-sm hover:bg-emerald-100"
        >
          답변 대기 보기(멘토)
        </Link>
      </div>
    </div>
  );
}
