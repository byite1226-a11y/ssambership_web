"use client";

import { useEffect } from "react";

/**
 * 게시글 조회수 — 세션당 1회만 +1 (sessionStorage 가드).
 * 서버 렌더마다 증가하던 문제(좋아요/스크랩/새로고침 시 중복 증가) 방지.
 */
export function BoardViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    if (!postId) return;
    const key = `bv:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage 불가 환경: 그래도 1회 호출은 진행 */
    }
    void fetch("/api/community/board/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {
      /* 조회수는 best-effort */
    });
  }, [postId]);

  return null;
}
