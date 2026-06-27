"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, Share2 } from "lucide-react";
import { AppToast } from "@/components/ui/AppToast";

export function MentorDetailHeaderActions(props: {
  mentorId: string;
  isLoggedIn: boolean;
  initialFavorited: boolean;
  favoriteCount?: number | null;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(props.initialFavorited);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const loginHref = `/login?next=${encodeURIComponent(`/mentors/${props.mentorId}`)}`;

  const favCount =
    props.favoriteCount != null && props.favoriteCount > 0
      ? props.favoriteCount
      : favorited
        ? 1
        : 0;

  const toggleFavorite = () => {
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

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "멘토 프로필", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast("링크가 복사되었어요.");
    } catch {
      /* cancelled */
    }
  };

  return (
    <>
    {toast ? <AppToast message={toast} onDismiss={() => setToast(null)} /> : null}
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void share()}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 sm:text-sm"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        공유하기
      </button>
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={pending}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:text-sm"
        aria-pressed={favorited}
      >
        <Heart
          className={`h-4 w-4 ${favorited ? "fill-[#2563EB] text-[#2563EB]" : "text-slate-400"}`}
          aria-hidden
        />
        찜하기 {favCount > 0 ? favCount.toLocaleString("ko-KR") : ""}
      </button>
    </div>
    </>
  );
}
