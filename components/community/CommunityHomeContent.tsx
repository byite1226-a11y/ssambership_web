import Link from "next/link";
import { CommunitySectionCard } from "@/components/community/CommunitySectionCard";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { pickTitle } from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

type Props = {
  shortRows: Row[];
  shortFetchFailed: boolean;
  boardRows: Row[];
  boardFetchFailed: boolean;
};

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
          <p className="text-sm text-slate-600">숏폼 영상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : shortRows.length === 0 ? (
          <p className="text-sm text-slate-600">아직 등록된 숏폼 영상이 없습니다.</p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {shortRows.slice(0, 6).map((r, i) => {
              const id = typeof r.id === "string" ? r.id : null;
              return id ? (
                <CommunityShortformVideoCard key={id} row={r} href={`/community/shortform/${id}`} linkLabel="영상 보기" />
              ) : (
                <li key={`sr-${i}`} className="list-none rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  항목을 표시할 수 없습니다.
                </li>
              );
            })}
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

      <p className="text-sm text-slate-600">
        숏폼 영상·게시판은 왼쪽 메뉴와 위 버튼으로도 이동할 수 있어요. 좋은 글은 스크랩하고, 문제가 있으면 신고해 주세요.
      </p>
    </div>
  );
}
