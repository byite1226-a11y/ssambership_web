import type { ReactNode } from "react";
import Link from "next/link";
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

export function CommunityMeTabPanels(props: {
  tab: CommunityMeTab;
  loggedIn: boolean;
  role: AppRole | null | undefined;
  loginNextPath: string;
}) {
  const { tab, loggedIn, role } = props;
  const isMentor = role === "mentor";

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

  if (isMentor) {
    if (tab === "overview") {
      return (
        <div className="space-y-4">
          <Panel title="내 커뮤니티 활동 요약">
            <p>
              게시글·숏폼 작성과 스크랩·팔로우를 탭으로 나눠 확인할 수 있어요. 목록 API가 연결되면 각 탭에 콘텐츠가
              쌓입니다.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={communityMePath("posts")}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 hover:border-slate-300"
              >
                내 게시글
              </Link>
              <Link href="/community/shortform" className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-bold text-slate-900 hover:border-slate-300">
                내 숏폼 탐색
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
          <p>작성한 게시글 목록은 아직 이 화면에 연결되지 않았습니다. 게시판에서 글을 확인하고 새 글을 이어 쓸 수 있어요.</p>
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
          <p>스크랩한 콘텐츠가 아직 없습니다. 관심 있는 글과 숏폼을 모아 두면 나중에 다시 보기 좋아요.</p>
          <ExploreLinks />
        </Panel>
      );
    }
    return (
      <Panel title="팔로우">
        <p>팔로우한 멘토가 아직 없습니다. 숏폼과 게시판에서 멘토 콘텐츠를 둘러보세요.</p>
        <ExploreLinks />
      </Panel>
    );
  }

  /* student · admin · 기타 로그인 */
  if (tab === "overview") {
    return (
      <Panel title="커뮤니티 활동 요약">
        <p>
          댓글로 소통하고, 스크랩으로 정리하고, 팔로우로 관심 멘토를 모아 보세요. 세부 내역은 데이터 연결 후 각 탭에
          표시됩니다.
        </p>
        <ExploreLinks />
      </Panel>
    );
  }
  if (tab === "posts") {
    return (
      <Panel title="내 게시글">
        <p>초기에는 학생 게시글 작성이 열려 있지 않습니다. 멘토의 게시글과 숏폼을 둘러보세요.</p>
        <ExploreLinks />
      </Panel>
    );
  }
  if (tab === "scraps") {
    return (
      <Panel title="스크랩">
        <p>스크랩한 콘텐츠가 아직 없습니다.</p>
        <ExploreLinks />
      </Panel>
    );
  }
  return (
    <Panel title="팔로우">
      <p>팔로우한 멘토가 아직 없습니다.</p>
      <ExploreLinks />
    </Panel>
  );
}
