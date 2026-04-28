import Link from "next/link";
import type { ReactNode } from "react";
import { StateBanner } from "@/components/community/StateBanner";
import { pickExcerpt, pickTitle } from "@/lib/community/communityQueries";

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
  uploadCta: { href: string; label: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <TabLink href="/community" label="홈" active={props.activeTab === "home"} />
        <TabLink href="/community/shorts" label="숏폼" active={props.activeTab === "shorts"} />
        <TabLink href="/community/board" label="게시판" active={props.activeTab === "board"} />
      </div>

      {props.recommendSlot ? <div>{props.recommendSlot}</div> : null}

      {props.categoryFilterSlot ? <div>{props.categoryFilterSlot}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">이번 주 숏폼</h2>
          <Link href="/community/shorts" className="text-sm font-bold text-blue-700">
            전체 보기
          </Link>
        </div>
        {props.shortError ? <div className="mt-2"><StateBanner kind="error" message={props.shortError} /></div> : null}
        {!props.shortError && props.shortRows.length === 0 ? (
          <div className="mt-2">
            <StateBanner kind="empty" message="아직 등록된 숏폼이 없습니다. 숏폼 탭에서 새 글을 모아 볼 수 있어요." />
          </div>
        ) : null}
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {props.shortRows.slice(0, 3).map((r, i) => (
            <li
              key={typeof r.id === "string" ? r.id : `s-${i}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 shadow-sm"
            >
              <p className="text-sm font-extrabold text-slate-900">{pickTitle(r)}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600">{pickExcerpt(r) || "내용이 곧 표시돼요."}</p>
              {typeof r.id === "string" ? (
                <Link href={`/community/shorts/${r.id}`} className="mt-2 inline-block text-xs font-bold text-blue-700">
                  글 읽기
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">이번 주 게시판</h2>
          <Link href="/community/board" className="text-sm font-bold text-blue-700">
            전체 보기
          </Link>
        </div>
        {props.boardError ? <div className="mt-2"><StateBanner kind="error" message={props.boardError} /></div> : null}
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
          href="/question-room"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          질문하기
        </Link>
        <Link
          href={props.writeCta.href}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:border-slate-300"
        >
          {props.writeCta.label}
        </Link>
        <Link
          href={props.uploadCta.href}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:border-slate-300"
        >
          {props.uploadCta.label}
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
