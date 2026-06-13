"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { COMMUNITY_POST_CATEGORIES } from "@/lib/community/communityBoardConstants";
import type { CommunityBoardPostCard } from "@/lib/community/communityBoardQueries";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { communityFilterChipClass } from "@/components/community/communityFilterChipStyles";
import {
  CommunityBoardSortTabs,
} from "@/components/community/CommunityBoardSortTabs";
import {
  parseCommunityBoardSortTab,
  type CommunityBoardSortTab,
} from "@/lib/community/communityBoardSort";

const PRIMARY = "#1A56DB";

type Props = {
  initialPosts: CommunityBoardPostCard[];
  initialCursor: string | null;
  initialCategory: string;
  initialSort?: CommunityBoardSortTab;
  showSortTabs?: boolean;
  /** 목록 URL 기준 (홈: /community, 게시판: /community/board) */
  basePath?: string;
  writeHref?: string;
};

export function CommunityHomeFeed(props: Props) {
  const basePath = props.basePath ?? "/community";
  const writeHref = props.writeHref ?? "/community/new";
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? props.initialCategory ?? "all";
  const sortTab = parseCommunityBoardSortTab(searchParams.get("tab") ?? props.initialSort ?? "all");

  const [posts, setPosts] = useState(props.initialPosts);
  const [cursor, setCursor] = useState<string | null>(props.initialCursor);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!props.initialCursor);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (category === props.initialCategory && sortTab === (props.initialSort ?? "all")) {
      setPosts(props.initialPosts);
      setCursor(props.initialCursor);
      setDone(!props.initialCursor);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ category, limit: "12" });
        if (sortTab !== "all") q.set("tab", sortTab);
        const res = await fetch(`/api/community/posts?${q.toString()}`);
        const json = (await res.json()) as { posts: CommunityBoardPostCard[]; nextCursor: string | null };
        if (!cancelled) {
          setPosts(json.posts);
          setCursor(json.nextCursor);
          setDone(!json.nextCursor);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.initialPosts, props.initialCursor, props.initialCategory, props.initialSort, category, sortTab, basePath]);

  const loadMore = useCallback(async () => {
    if (loading || done || !cursor) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ category, cursor, limit: "12" });
      if (sortTab !== "all") q.set("tab", sortTab);
      const res = await fetch(`/api/community/posts?${q.toString()}`);
      const json = (await res.json()) as {
        posts: CommunityBoardPostCard[];
        nextCursor: string | null;
      };
      setPosts((prev) => [...prev, ...json.posts]);
      setCursor(json.nextCursor);
      setDone(!json.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [category, cursor, done, loading, sortTab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  function onTab(slug: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (slug === "all") p.delete("category");
    else p.set("category", slug);
    const qs = p.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <section className="space-y-4">
      {props.showSortTabs ? (
        <CommunityBoardSortTabs active={sortTab} basePath={basePath} />
      ) : null}
      <nav className="flex flex-wrap gap-2" aria-label="카테고리">
        {COMMUNITY_POST_CATEGORIES.map((c) => {
          const active = category === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => onTab(c.slug)}
              className={communityFilterChipClass(active, "sm")}
            >
              {c.label}
            </button>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <PenLine className="h-12 w-12 text-slate-400" strokeWidth={1.5} aria-hidden />
          <h3 className="mt-4 text-lg font-black text-slate-900">아직 게시글이 없어요</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">이 카테고리에 첫 번째 글을 작성해보세요.</p>
          <Link
            href={writeHref}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1A56DB] px-5 text-sm font-extrabold text-white hover:bg-[#1648c0]"
          >
            글 작성하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <CommunityPostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-8" aria-hidden />
      {loading ? (
        <p className="text-center text-xs font-semibold text-slate-500">불러오는 중…</p>
      ) : null}
      {done && posts.length > 0 ? (
        <p className="text-center text-xs text-slate-400">모두 불러왔습니다.</p>
      ) : null}

      <Link
        href={writeHref}
        className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-1 rounded-full px-5 text-sm font-extrabold text-white shadow-lg transition hover:scale-105 sm:bottom-8 sm:right-8"
        style={{ backgroundColor: PRIMARY }}
        aria-label="글쓰기"
      >
        <span className="text-xl leading-none">+</span>
        <span>글쓰기</span>
      </Link>
    </section>
  );
}
