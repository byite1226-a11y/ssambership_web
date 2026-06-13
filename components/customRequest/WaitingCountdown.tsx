"use client";

import { useEffect, useState } from "react";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type Props = {
  deadlineIso: string | null;
  className?: string;
};

function endOfDeadlineDayMs(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function toParts(remainingMs: number): CountdownParts {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function WaitingCountdown(props: Props) {
  const { deadlineIso, className = "" } = props;
  const targetMs = deadlineIso ? endOfDeadlineDayMs(deadlineIso) : null;

  const [parts, setParts] = useState<CountdownParts | null>(() => {
    if (targetMs == null) return null;
    return toParts(targetMs - Date.now());
  });

  useEffect(() => {
    if (targetMs == null) {
      return;
    }
    const tick = () => setParts(toParts(targetMs - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (targetMs == null || parts == null) {
    return (
      <p className={`text-sm font-medium text-slate-600 ${className}`}>마감일 정보가 없어요.</p>
    );
  }

  const units: { label: string; value: number }[] = [
    { label: "일", value: parts.days },
    { label: "시간", value: parts.hours },
    { label: "분", value: parts.minutes },
    { label: "초", value: parts.seconds },
  ];

  return (
    <div className={`flex flex-wrap gap-2 sm:gap-3 ${className}`} aria-live="polite">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex min-w-[4.5rem] flex-col items-center rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <span className="text-xl font-black tabular-nums text-[#1A56DB] sm:text-2xl">
            {u.label === "일" ? u.value : pad(u.value)}
          </span>
          <span className="mt-0.5 text-[11px] font-bold text-slate-500">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
