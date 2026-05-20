"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { COMMUNITY_POST_CATEGORIES } from "@/lib/community/communityBoardConstants";
import type { CommunityBoardPostCard } from "@/lib/community/communityBoardQueries";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";

const PRIMARY = "#1A56DB";

type Props = {
  initialPosts: CommunityBoardPostCard[];
  initialCursor: string | null;
  initialCategory: string;
};

export function CommunityHomeFeed(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? props.initialCategory ?? "all";

  const [posts, setPosts] = useState(props.initialPosts);
  const [cursor, setCursor] = useState<string | null>(props.initialCursor);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!props.initialCursor);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (category === props.initialCategory) {
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
  }, [props.initialPosts, props.initialCursor, props.initialCategory, category]);

  const loadMore = useCallback(async () => {
    if (loading || done || !cursor) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ category, cursor, limit: "12" });
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
  }, [category, cursor, done, loading]);

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
    router.push(`/community?${p.toString()}`);
  }

  return (
    <section className="space-y-4">
      <nav className="flex flex-wrap gap-2" aria-label={"\uCE74\uD14C\uACE0\uB9AC"}>
        {COMMUNITY_POST_CATEGORIES.map((c) => {
          const active = category === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => onTab(c.slug)}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                active ? "text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
              style={active ? { backgroundColor: PRIMARY } : undefined}
            >
              {c.label}
            </button>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          {"\uC544\uC9C1 \uAC8C\uC2DC\uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uCCAB \uAE00\uC744 \uC791\uC131\uD574 \uBCF4\uC138\uC694!"}
        </p>
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
        <p className="text-center text-xs font-semibold text-slate-500">{"\uBD88\uB7EC\uC624\uB294 \uC911\u2026"}</p>
      ) : null}
      {done && posts.length > 0 ? (
        <p className="text-center text-xs text-slate-400">{"\uBAA8\uB450 \uBD88\uB7EC\uC654\uC2B5\uB2C8\uB2E4."}</p>
      ) : null}

      <Link
        href="/community/new"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg transition hover:scale-105 sm:bottom-8 sm:right-8"
        style={{ backgroundColor: PRIMARY }}
        aria-label={"\uAE00\uC4F0\uAE30"}
      >
        +
      </Link>
    </section>
  );
}
