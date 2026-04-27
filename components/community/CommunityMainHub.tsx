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
  recommendSlot: ReactNode;
  categoryFilterSlot: ReactNode;
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

      {props.recommendSlot}

      {props.categoryFilterSlot}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">대표 숏폼</h2>
          <Link href="/community/shorts" className="text-sm font-bold text-blue-700">
            전체 →
          </Link>
        </div>
        {props.shortError ? <div className="mt-2"><StateBanner kind="error" message={props.shortError} /></div> : null}
        {!props.shortError && props.shortRows.length === 0 ? <div className="mt-2"><StateBanner kind="empty" message="숏폼 글이 없습니다. shortform_posts 연결 후 표시됩니다." /></div> : null}
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {props.shortRows.slice(0, 3).map((r, i) => (
            <li key={typeof r.id === "string" ? r.id : `s-${i}`} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-extrabold text-slate-900">{pickTitle(r)}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600">{pickExcerpt(r) || "(본문 컬럼 확인)"}</p>
              {typeof r.id === "string" ? (
                <Link href={`/community/shorts/${r.id}`} className="mt-2 inline-block text-xs font-bold text-blue-700">
                  열기
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">대표 게시글</h2>
          <Link href="/community/board" className="text-sm font-bold text-blue-700">
            전체 →
          </Link>
        </div>
        {props.boardError ? <div className="mt-2"><StateBanner kind="error" message={props.boardError} /></div> : null}
        {!props.boardError && props.boardRows.length === 0 ? <div className="mt-2"><StateBanner kind="empty" message="게시글이 없습니다. community_posts 연결 후 표시됩니다." /></div> : null}
        <ul className="mt-3 space-y-2">
          {props.boardRows.slice(0, 5).map((r, i) => (
            <li
              key={typeof r.id === "string" ? r.id : `b-${i}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm"
            >
              <div>
                {typeof r.category === "string" ? (
                  <span className="text-xs font-bold text-slate-500">[{r.category}] </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">[카테고리] </span>
                )}
                <span className="font-extrabold text-slate-900">{pickTitle(r)}</span>
                {typeof r.author_id === "string" ? <span className="ml-2 text-xs text-slate-500">· 작성자id</span> : null}
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

      <div className="flex flex-wrap gap-2">
        <Link href={props.writeCta.href} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900">
          {props.writeCta.label}
        </Link>
        <Link href={props.uploadCta.href} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
          {props.uploadCta.label}
        </Link>
      </div>
    </div>
  );
}

export function CommunityRecommendToggleSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
      <span className="font-extrabold">추천 / 최신</span>
      <button type="button" disabled className="cursor-not-allowed rounded bg-white px-3 py-1 text-xs font-bold text-slate-500">
        추천(연결 예정)
      </button>
      <button type="button" disabled className="cursor-not-allowed rounded border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
        최신(연결 예정)
      </button>
    </div>
  );
}

export function CommunityCategoryFilterSkeleton() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
      <span className="font-extrabold">카테고리 필터</span>
      <div className="mt-2 flex flex-wrap gap-1">
        {["전체", "공지", "질문", "정보"].map((c) => (
          <span
            key={c}
            className="cursor-not-allowed rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-500"
          >
            {c}
          </span>
        ))}
        <span className="text-xs text-slate-500">(스키마·RLS 연동 후)</span>
      </div>
    </div>
  );
}
