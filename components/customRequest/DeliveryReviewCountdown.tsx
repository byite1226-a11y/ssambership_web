"use client";

import { useEffect, useState } from "react";

type ReviewParts = {
  days: number;
  hours: number;
  minutes: number;
};

type Props = {
  reviewDeadlineIso: string | null;
  className?: string;
};

function toParts(remainingMs: number): ReviewParts {
  const totalMinutes = Math.max(0, Math.floor(remainingMs / 60_000));
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function DeliveryReviewCountdown(props: Props) {
  const { reviewDeadlineIso, className = "" } = props;
  const targetMs = reviewDeadlineIso ? new Date(reviewDeadlineIso).getTime() : null;

  const [parts, setParts] = useState<ReviewParts | null>(() => {
    if (targetMs == null) return null;
    return toParts(targetMs - Date.now());
  });

  useEffect(() => {
    if (targetMs == null) return;
    const tick = () => setParts(toParts(targetMs - Date.now()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (targetMs == null || parts == null) {
    return <p className={`text-sm font-medium text-slate-600 ${className}`}>검토 기간 정보를 불러올 수 없어요.</p>;
  }

  const units: { label: string; value: string }[] = [
    { label: "일", value: String(parts.days) },
    { label: "시간", value: pad(parts.hours) },
    { label: "분", value: pad(parts.minutes) },
  ];

  return (
    <div className={`flex flex-wrap gap-2 sm:gap-3 ${className}`} aria-live="polite">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex min-w-[4.5rem] flex-col items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <span className="text-xl font-black tabular-nums text-[#1A56DB] sm:text-2xl">{u.value}</span>
          <span className="mt-0.5 text-[11px] font-bold text-slate-500">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
