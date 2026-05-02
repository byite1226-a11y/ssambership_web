import { CommunitySectionCard } from "@/components/community/CommunitySectionCard";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { CommunityBoardPostRow } from "@/components/community/CommunityBoardPostRow";
import { CommunityShortformEmptyPanel } from "@/components/community/CommunityShortformEmptyPanel";
import type { AppRole } from "@/lib/types/user";

type Row = Record<string, unknown>;

type Props = {
  shortRows: Row[];
  shortFetchFailed: boolean;
  boardRows: Row[];
  boardFetchFailed: boolean;
  viewerRole: AppRole | null | undefined;
  loggedIn: boolean;
};

export function CommunityHomeContent(props: Props) {
  const { shortRows, shortFetchFailed, boardRows, boardFetchFailed, viewerRole, loggedIn } = props;
  const popularBoard = boardRows.slice(0, 5);
  const weeklyBoard = boardRows.slice(5, 13);

  return (
    <div className="space-y-6">
      <CommunitySectionCard
        title="추천 숏폼"
        subtitle="멘토가 올린 짧은 세로형 학습 영상을 한눈에 모았어요."
        action={{ href: "/community/shortform", label: "숏폼 보기" }}
      >
        {shortFetchFailed ? (
          <p className="text-sm text-slate-600">숏폼 영상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : shortRows.length === 0 ? (
          <CommunityShortformEmptyPanel role={viewerRole} loggedIn={loggedIn} compact />
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

      <CommunitySectionCard
        title="인기 게시글"
        subtitle="공부법·해설·후기·학습 팁 중심의 글을 빠르게 살펴보세요."
        action={{ href: "/community/board", label: "게시판 보기" }}
      >
        {boardFetchFailed ? (
          <p className="text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : popularBoard.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
            아직 표시할 인기 게시글이 없어요. 게시판에서 전체 목록을 확인해 보세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {popularBoard.map((r, i) => (
              <CommunityBoardPostRow key={typeof r.id === "string" ? r.id : `p-${i}`} row={r} index={i} dense />
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <CommunitySectionCard
        title="이번 주 게시판"
        subtitle="최근 올라온 글을 모아 두었어요. 더 많은 글은 게시판에서 이어서 볼 수 있어요."
        action={{ href: "/community/board", label: "게시판 보기" }}
      >
        {boardFetchFailed ? (
          <p className="text-sm text-slate-600">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : weeklyBoard.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">이번 주에 추가된 글이 아직 없어요.</p>
            <p className="mt-2 leading-relaxed">
              게시판에서 전체 글을 둘러보거나, 멘토라면 첫 게시글을 작성해 커뮤니티를 채워 주세요.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {weeklyBoard.map((r, i) => (
              <CommunityBoardPostRow key={typeof r.id === "string" ? r.id : `w-${i}`} row={r} index={i} dense />
            ))}
          </ul>
        )}
      </CommunitySectionCard>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 px-5 py-4 text-sm text-slate-700">
        <p className="font-extrabold text-slate-900">함께 지키는 커뮤니티</p>
        <p className="mt-2 leading-relaxed text-slate-600">
          숏폼·게시판은 왼쪽 메뉴와 위 링크로 이동할 수 있어요. 좋은 글은 스크랩하고, 문제가 있으면 신고로 알려 주세요.
        </p>
      </div>
    </div>
  );
}
