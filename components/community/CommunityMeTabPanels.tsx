import type { ReactNode } from "react";
import Link from "next/link";
import type { CommunityMePostListItem } from "@/lib/community/communityQueries";
import type { CommunityMeTab } from "@/lib/community/communityMeTab";
import { communityMePath } from "@/lib/community/communityMeTab";
import type { AppRole } from "@/lib/types/user";

const linkSlate =
  "inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300";
const linkBlue =
  "inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900 shadow-sm hover:bg-blue-100";
const btnMentor = "inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700";
const btnMentorSoft =
  "inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50";

export type CommunityMeActivityPayload = {
  myPosts: CommunityMePostListItem[];
  boardCount: number | null;
  shortformCount: number | null;
  recent: CommunityMePostListItem[];
  loadFailed: boolean;
};

function Panel(props: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-900">{props.title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-slate-600">{props.children}</div>
    </section>
  );
}

function ExploreLinks() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link href="/community" className={linkBlue}>
        커뮤니티 홈
      </Link>
      <Link href="/community/board" className={linkSlate}>
        게시판 보기
      </Link>
      <Link href="/community/shortform" className={linkSlate}>
        숏폼 보기
      </Link>
    </div>
  );
}

function KindBadge(props: { kind: "board" | "shortform" }) {
  const label = props.kind === "board" ? "게시판" : "숏폼";
  const cls =
    props.kind === "board"
      ? "border-slate-200 bg-slate-100 text-slate-800"
      : "border-violet-200 bg-violet-50 text-violet-900";
  return (
    <span className={`inline-flex shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-extrabold ${cls}`}>{label}</span>
  );
}

function MePostsList(props: { items: CommunityMePostListItem[] }) {
  if (props.items.length === 0) return null;
  return (
    <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/40">
      {props.items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <KindBadge kind={item.kind} />
            <div className="min-w-0 flex-1">
              {item.linkHref ? (
                <Link href={item.linkHref} className="font-bold text-slate-900 hover:text-blue-700">
                  <span className="line-clamp-2">{item.title}</span>
                </Link>
              ) : (
                <span className="font-bold text-slate-700 line-clamp-2">{item.title}</span>
              )}
              {item.dateLabel ? <p className="mt-0.5 text-xs text-slate-500">{item.dateLabel}</p> : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function countLine(board: number | null, shortform: number | null): string | null {
  const parts: string[] = [];
  if (typeof board === "number") parts.push(`게시글 ${board}개`);
  if (typeof shortform === "number") parts.push(`숏폼 ${shortform}개`);
  return parts.length ? parts.join(" · ") : null;
}

export function CommunityMeTabPanels(props: {
  tab: CommunityMeTab;
  loggedIn: boolean;
  role: AppRole | null | undefined;
  loginNextPath: string;
  activity: CommunityMeActivityPayload | null;
}) {
  const { tab, loggedIn, role, activity } = props;
  const isMentor = role === "mentor";
  const act = activity;

  if (!loggedIn) {
    const loginHref = `/login?next=${encodeURIComponent(props.loginNextPath)}`;
    const tabHint: Record<CommunityMeTab, string> = {
      overview: "전체 요약과 탭별 활동은 로그인 후 이용할 수 있어요.",
      posts: "내 게시글 탭은 로그인 후 이용할 수 있어요.",
      scraps: "스크랩 탭은 로그인 후 이용할 수 있어요.",
      follows: "팔로우 탭은 로그인 후 이용할 수 있어요.",
    };
    return (
      <Panel title="로그인이 필요해요">
        <p>{tabHint[tab]}</p>
        <p className="mt-2">로그인하면 댓글·스크랩 활동을 이어갈 수 있어요.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={loginHref} className={btnMentor}>
            로그인하고 댓글·스크랩 활동을 확인하기
          </Link>
          <Link href="/community" className={linkSlate}>
            커뮤니티 홈
          </Link>
        </div>
      </Panel>
    );
  }

  const overviewCounts = act ? countLine(act.boardCount, act.shortformCount) : null;
  const hasPosts = (act?.myPosts.length ?? 0) > 0;

  if (isMentor) {
    if (tab === "overview") {
      return (
        <div className="space-y-4">
          <Panel title="내 커뮤니티 활동 요약">
            <p>게시글·숏폼 작성과 스크랩·팔로우를 탭으로 나눠 확인할 수 있어요.</p>
            {act?.loadFailed ? (
              <p className="mt-2 text-xs font-semibold text-amber-800">내 글 개수·목록을 일시적으로 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p>
            ) : null}
            {overviewCounts ? <p className="mt-2 text-sm font-bold text-slate-900">{overviewCounts}</p> : null}
            {act && act.recent.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">최근 작성</p>
                <MePostsList items={act.recent} />
              </div>
            ) : !act?.loadFailed && !overviewCounts ? (
              <p className="mt-2 text-xs text-slate-500">아직 반영할 활동 요약이 없어요. 글을 작성하면 여기에 모입니다.</p>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={communityMePath("posts")}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 hover:border-slate-300"
              >
                내 게시글
              </Link>
              <Link href="/community/shortform" className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 hover:border-slate-300">
                숏폼 탐색
              </Link>
              <Link
                href={communityMePath("scraps")}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 hover:border-slate-300"
              >
                스크랩
              </Link>
              <Link
                href={communityMePath("follows")}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 hover:border-slate-300"
              >
                팔로우
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">스크랩·팔로우 목록은 데이터 연결 후 이 탭들에 표시될 예정이에요.</p>
            <div className="mt-4">
              <Link href="/mentor/community/new" className={btnMentorSoft}>
                멘토 글쓰기
              </Link>
            </div>
          </Panel>
        </div>
      );
    }
    if (tab === "posts") {
      return (
        <Panel title="내 게시글">
          {act?.loadFailed ? (
            <p className="text-amber-900">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          ) : hasPosts ? (
            <p className="text-slate-600">작성한 게시판 글과 숏폼이 최신순으로 표시됩니다.</p>
          ) : (
            <p>작성한 게시글이 아직 없어요. 게시판에서 글을 확인하고 새 글을 이어 쓸 수 있어요.</p>
          )}
          <MePostsList items={act?.myPosts ?? []} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/community/board" className={linkSlate}>
              게시판 보기
            </Link>
            <Link href="/mentor/community/new" className={btnMentor}>
              게시글 작성
            </Link>
          </div>
        </Panel>
      );
    }
    if (tab === "scraps") {
      return (
        <Panel title="스크랩">
          <p>스크랩한 콘텐츠 목록은 데이터 연결 후 이 탭에 표시될 예정이에요.</p>
          <ExploreLinks />
        </Panel>
      );
    }
    return (
      <Panel title="팔로우">
        <p>팔로우한 멘토 목록은 데이터 연결 후 이 탭에 표시될 예정이에요. 숏폼과 게시판에서 멘토 콘텐츠를 둘러보세요.</p>
        <ExploreLinks />
      </Panel>
    );
  }

  /* student · admin · 기타 로그인 — 작성 CTA 없음 */
  if (tab === "overview") {
    return (
      <Panel title="커뮤니티 활동 요약">
        <p>댓글로 소통하고, 스크랩으로 정리하고, 팔로우로 관심 멘토를 모아 보세요.</p>
        {act?.loadFailed ? (
          <p className="mt-2 text-xs font-semibold text-amber-800">내 글 요약을 일시적으로 불러오지 못했어요.</p>
        ) : null}
        {overviewCounts ? <p className="mt-2 text-sm font-bold text-slate-900">{overviewCounts}</p> : null}
        {act && act.recent.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">최근 작성</p>
            <MePostsList items={act.recent} />
          </div>
        ) : null}
        <p className="mt-3 text-xs text-slate-500">스크랩·팔로우·댓글 내역은 데이터 연결 후 각 탭에 표시될 예정이에요.</p>
        <ExploreLinks />
      </Panel>
    );
  }
  if (tab === "posts") {
    return (
      <Panel title="내 게시글">
        {act?.loadFailed ? (
          <p className="text-amber-900">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        ) : hasPosts ? (
          <p className="text-slate-600">작성한 게시판 글·숏폼이 최신순으로 표시됩니다.</p>
        ) : (
          <p>작성 가능한 커뮤니티 게시글이 없거나, 아직 작성한 글이 없어요. 멘토의 게시글과 숏폼을 둘러보세요.</p>
        )}
        <MePostsList items={act?.myPosts ?? []} />
        <ExploreLinks />
      </Panel>
    );
  }
  if (tab === "scraps") {
    return (
      <Panel title="스크랩">
        <p>스크랩한 콘텐츠 목록은 데이터 연결 후 이 탭에 표시될 예정이에요.</p>
        <ExploreLinks />
      </Panel>
    );
  }
  return (
    <Panel title="팔로우">
      <p>팔로우한 멘토 목록은 데이터 연결 후 이 탭에 표시될 예정이에요.</p>
      <ExploreLinks />
    </Panel>
  );
}
