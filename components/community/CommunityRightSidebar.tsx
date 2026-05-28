"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CommunityPopularMentor } from "@/components/community/CommunityNavTypes";

const PRIMARY = "#1A56DB";

const QUICK_LINKS = [
  { href: "/community", label: "커뮤니티 홈" },
  { href: "/community/board", label: "게시판 보기" },
  { href: "/community/shortform", label: "숏폼 보기" },
] as const;

const HOT_TOPICS = [
  { rank: 1, label: "학습 루틴 나누기" },
  { rank: 2, label: "포트폴리오 피드백" },
  { rank: 3, label: "면접 질문 모음" },
  { rank: 4, label: "자격증 후기" },
  { rank: 5, label: "이직 준비 팁" },
] as const;

const CHALLENGE_TABS = [
  { href: "/community", label: "커뮤니티 홈", match: (p: string) => p === "/community" },
  { href: "/community/board", label: "게시판", match: (p: string) => p.startsWith("/community/board") },
  { href: "/community/shortform", label: "숏폼", match: (p: string) => p.startsWith("/community/shortform") },
] as const;

export function CommunityRightSidebar(props: { weeklyTopMentor?: CommunityPopularMentor | null }) {
  const pathname = usePathname();
  const mentor = props.weeklyTopMentor ?? null;

  return (
    <aside className="w-full space-y-4 lg:w-[280px]" aria-label="커뮤니티 사이드">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">빠른 이동</h3>
        <ul className="mt-3 space-y-1.5">
          {QUICK_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1A56DB]"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">실시간 인기 주제</h3>
        <ol className="mt-3 space-y-2">
          {HOT_TOPICS.map((t) => (
            <li key={t.rank} className="flex items-start gap-2 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-600">
                {t.rank}
              </span>
              <span className="font-semibold leading-snug text-slate-800">{t.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">주간 인기 멘토</h3>
        {mentor ? (
          <Link
            href={`/mentors/${mentor.id}`}
            className="mt-3 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-[#1A56DB]/30 hover:bg-blue-50/30"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
              style={{ backgroundColor: PRIMARY }}
            >
              {mentor.rank}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-slate-900">{mentor.name}</span>
              {mentor.school ? (
                <span className="mt-0.5 block truncate text-[10px] text-slate-500">{mentor.school}</span>
              ) : null}
              {mentor.priceLabel ? (
                <span className="mt-1 block text-[10px] font-bold text-[#1A56DB]">{mentor.priceLabel}</span>
              ) : null}
            </span>
          </Link>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-medium text-slate-500">
            인기 멘토 데이터 준비 중
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900">우수 활동자 도전</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          이번 주 활동으로 배지와 노출 기회를 노려 보세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {CHALLENGE_TABS.map((t) => {
            const active = t.match(pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-extrabold transition",
                  active ? "bg-white text-[#1A56DB] shadow-sm" : "text-slate-600 hover:text-slate-900",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
