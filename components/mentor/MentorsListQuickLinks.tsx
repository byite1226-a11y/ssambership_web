"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { recentMentorCount } from "@/lib/mentor/recentMentorsStorage";

export function MentorsListQuickLinks(props: { favoriteCount: number }) {
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    setRecentCount(recentMentorCount());
  }, []);

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Link
        href="/mentors?view=list"
        className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm"
      >
        최근 본 멘토 {recentCount}
      </Link>
      <Link
        href="/mentors?view=list"
        className="inline-flex min-h-[44px] items-center rounded-xl border border-[#2563EB]/30 bg-blue-50/50 px-3 text-xs font-extrabold text-[#2563EB] hover:bg-blue-50 sm:px-4 sm:text-sm"
      >
        찜한 멘토 {props.favoriteCount}
      </Link>
    </div>
  );
}
