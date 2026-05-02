import Link from "next/link";
import type { ReactNode } from "react";
import { StateBanner } from "@/components/community/StateBanner";
import { CommunityShortformVideoCard } from "@/components/community/CommunityShortformVideoCard";
import { pickTitle } from "@/lib/community/communityQueries";

type Row = Record<string, unknown>;

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-lg px-3 py-1.5 text-sm font-extrabold",
        active ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export function CommunityMainHub(props: {
  /** 메인은 '허브' — 탭은 동일 경로에서 구분하거나 링크로 전환 */
  activeTab: "home" | "shorts" | "board";
  shortRows: Row[];
  shortError: string | null;
  boardRows: Row[];
  boardError: string | null;
  recommendSlot?: ReactNode;
  categoryFilterSlot?: ReactNode;
  writeCta: { href: string; label: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <TabLink href="/community" label="홈" active={props.activeTab === "home"} />
        <TabLink href="/community/shortform" label="숏폼" active={props.activeTab === "shorts"} />
        <TabLink href="/community/board" label="게시판" active={props.activeTab === "board"} />
      </div>

      {props.recommendSlot ? <div>{props.recommendSlot}</div> : null}

      {props.categoryFilterSlot ? <div>{props.categoryFilterSlot}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">추천 숏폼 영상</h2>
          <Link href="/community/shortform" className="text-sm font-bold text-blue-700">
            전체 보기
          </Link>
        </div>
        {props.shortError ? (
          <div className="mt-2">
            <StateBanner kind="error" message="숏폼 영상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
          </div>
        ) : null}
        {!props.shortError && props.shortRows.length === 0 ? (
          <div className="mt-2">
            <StateBanner kind="empty" message="아직 등록된 숏폼 영상이 없습니다." />
          </div>
        ) : null}
        <ul className="mt-3 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {props.shortRows.slice(0, 3).map((r, i) => {
            const id = typeof r.id === "string" ? r.id : null;
            return id ? (
              <CommunityShortformVideoCard key={id} row={r} href={`/community/shortform/${id}`} linkLabel="영상 보기" />
            ) : (
              <li key={`s-${i}`} className="list-none rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                {pickTitle(r)}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">이번 주 게시판</h2>
          <Link href="/community/board" className="text-sm font-bold text-blue-700">
            전체 보기
          </Link>
        </div>
        {props.boardError ? (
          <div className="mt-2">
            <StateBanner kind="error" message="게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
          </div>
        ) : null}
        {!props.boardError && props.boardRows.length === 0 ? (
          <div className="mt-2">
            <StateBanner kind="empty" message="아직 등록된 게시글이 없습니다. 게시판 탭에서 전체 글을 확인해 보세요." />
          </div>
        ) : null}
        <ul className="mt-3 space-y-2">
          {props.boardRows.slice(0, 5).map((r, i) => (
            <li
              key={typeof r.id === "string" ? r.id : `b-${i}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/40 p-4 text-sm shadow-sm"
            >
              <div className="min-w-0">
                {typeof r.category === "string" ? (
                  <span className="text-xs font-bold text-slate-500">[{r.category}] </span>
                ) : null}
                <span className="font-extrabold text-slate-900">{pickTitle(r)}</span>
              </div>
              {typeof r.id === "string" ? (
                <Link href={`/community/board/${r.id}`} className="shrink-0 text-xs font-bold text-blue-700">
                  읽기
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/community"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          커뮤니티 홈
        </Link>
        <Link
          href={props.writeCta.href}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:border-slate-300"
        >
          {props.writeCta.label}
        </Link>
      </div>
    </div>
  );
}
