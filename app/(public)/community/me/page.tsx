import type { ReactNode } from "react";
import Link from "next/link";
import { CommunityLayoutShell } from "@/components/community/CommunityLayoutShell";
import { CommunityPageHero } from "@/components/community/CommunityPageHero";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { buildCommunityHeroCtas } from "@/lib/community/communityHeroActions";
import type { AppRole } from "@/lib/types/user";

function meDescription(role: AppRole | null | undefined, loggedIn: boolean): string {
  if (role === "mentor") {
    return "게시글·숏폼 작성과 목록 탐색, 내 활동을 한곳에서 이어가 보세요.";
  }
  if (!loggedIn) {
    return "스크랩, 댓글, 팔로우 등 내 커뮤니티 활동은 로그인 후 이용할 수 있어요.";
  }
  return "스크랩, 댓글, 팔로우 등 내 커뮤니티 활동을 확인하세요.";
}

function MePanel(props: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-900">{props.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{props.description}</p>
      {props.children ? <div className="mt-4 flex flex-wrap gap-2">{props.children}</div> : null}
    </section>
  );
}

export default async function CommunityMePage() {
  const { user, profile } = await getServerUserWithProfile();
  const loggedIn = user != null;
  const role = profile?.role;
  const isMentor = role === "mentor";

  return (
    <CommunityLayoutShell
      activeNav="me"
      hero={
        <CommunityPageHero
          eyebrow="커뮤니티"
          title="내 공간"
          description={meDescription(role, loggedIn)}
          ctas={buildCommunityHeroCtas({
            surface: "me",
            role,
            loggedIn,
            nextPath: "/community/me",
          })}
        />
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 shadow-inner">
          <p className="font-extrabold text-slate-900">내 활동 안내</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
            실제 스크랩·댓글·팔로우 데이터는 단계적으로 연결됩니다. 지금은 커뮤니티 안을 탐색하며 콘텐츠를 모아 보세요.
          </p>
        </div>

        {!loggedIn ? (
          <MePanel
            title="로그인이 필요해요"
            description="로그인하면 댓글·스크랩 등 개인화 기능을 이용할 수 있어요."
          >
            <Link
              href={`/login?next=${encodeURIComponent("/community/me")}`}
              className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              로그인
            </Link>
            <Link
              href="/community"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300"
            >
              커뮤니티 홈
            </Link>
          </MePanel>
        ) : isMentor ? (
          <div className="grid gap-4 md:grid-cols-2">
            <MePanel
              title="내 게시글"
              description="작성한 게시글을 한곳에서 관리하는 화면은 준비 중입니다. 게시판에서 글을 확인하고 새 글을 이어 쓸 수 있어요."
            >
              <Link
                href="/community/board"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300"
              >
                게시판 보기
              </Link>
              <Link
                href="/mentor/community/new"
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                멘토 글쓰기
              </Link>
            </MePanel>
            <MePanel
              title="내 숏폼"
              description="업로드한 숏폼을 모아 보는 전용 목록은 준비 중입니다. 숏폼 피드에서 콘텐츠를 점검해 보세요."
            >
              <Link
                href="/community/shortform"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300"
              >
                숏폼 보기
              </Link>
              <Link
                href="/mentor/community/new"
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                숏폼 업로드
              </Link>
            </MePanel>
            <MePanel
              title="커뮤니티 홈"
              description="추천 숏폼과 인기 게시글을 다시 확인해 보세요."
            >
              <Link
                href="/community"
                className="inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900 shadow-sm hover:bg-blue-100"
              >
                커뮤니티 홈
              </Link>
            </MePanel>
            <MePanel
              title="작성 · 업로드"
              description="게시글과 숏폼을 한 화면에서 시작할 수 있어요."
            >
              <Link
                href="/mentor/community/new"
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                멘토 글쓰기
              </Link>
            </MePanel>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <MePanel
              title="스크랩"
              description="관심 있는 게시글과 숏폼을 모아 두는 공간입니다. 데이터가 연결되면 이곳에 표시됩니다."
            >
              <Link
                href="/community/board"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300"
              >
                게시판 보기
              </Link>
              <Link
                href="/community/shortform"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300"
              >
                숏폼 보기
              </Link>
            </MePanel>
            <MePanel
              title="댓글"
              description="작성한 댓글은 활동이 쌓이면 이곳에서 한눈에 확인할 수 있도록 준비 중입니다."
            >
              <Link
                href="/community/board"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300"
              >
                게시판 보기
              </Link>
            </MePanel>
            <MePanel
              title="팔로우"
              description="팔로우한 멘토 목록은 데이터가 준비되면 이곳에 표시됩니다."
            >
              <Link
                href="/community/shortform"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300"
              >
                숏폼 보기
              </Link>
            </MePanel>
            <MePanel
              title="내 게시글"
              description="학생 계정의 작성 글은 초기 단계에서 비어 있을 수 있어요. 멘토 콘텐츠를 탐색해 보세요."
            >
              <Link
                href="/community"
                className="inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900 shadow-sm hover:bg-blue-100"
              >
                커뮤니티 홈
              </Link>
            </MePanel>
          </div>
        )}
      </div>
    </CommunityLayoutShell>
  );
}
