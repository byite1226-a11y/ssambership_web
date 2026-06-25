"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function MentorFavoriteButton(props: {
  mentorId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  loginNext?: string;
  className?: string;
  /** 하트 옆에 찜/찜됨 텍스트 표시(목록 카드의 떠있는 하트가 아닌 인라인 버튼용) */
  showText?: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(props.initialFavorited);
  const [pending, startTransition] = useTransition();
  const loginHref = `/login?next=${encodeURIComponent(props.loginNext ?? "/mentors")}`;

  const toggle = () => {
    if (!props.isLoggedIn) {
      router.push(loginHref);
      return;
    }
    startTransition(async () => {
      try {
        if (favorited) {
          const res = await fetch(`/api/mentors/favorites?mentorId=${encodeURIComponent(props.mentorId)}`, {
            method: "DELETE",
          });
          const json = (await res.json()) as { ok?: boolean };
          if (res.ok && json.ok) setFavorited(false);
        } else {
          const res = await fetch("/api/mentors/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mentorId: props.mentorId }),
          });
          const json = (await res.json()) as { ok?: boolean };
          if (res.ok && json.ok) setFavorited(true);
        }
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={favorited ? "찜 해제" : "찜하기"}
      aria-pressed={favorited}
      className={
        props.className ??
        "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 shadow-sm transition hover:scale-105 disabled:opacity-60"
      }
    >
      <Heart
        className={`h-4 w-4 ${favorited ? "fill-[#1A56DB] text-[#1A56DB]" : "text-slate-400"}`}
        strokeWidth={2}
      />
      {props.showText ? <span>{favorited ? "찜됨" : "찜"}</span> : null}
    </button>
  );
}
