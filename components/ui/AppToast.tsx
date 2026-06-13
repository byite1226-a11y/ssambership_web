"use client";

import { useEffect } from "react";

export function AppToast(props: {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    const t = window.setTimeout(() => props.onDismiss(), props.durationMs ?? 2800);
    return () => window.clearTimeout(t);
  }, [props]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[100] max-w-sm -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg"
    >
      {props.message}
    </div>
  );
}
