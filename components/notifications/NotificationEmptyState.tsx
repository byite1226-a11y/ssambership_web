import { Bell, CheckCheck } from "lucide-react";

type Filter = "all" | "unread";

const TYPE_HINTS = ["질문방", "구독·결제", "맞춤의뢰", "환불", "공지"] as const;

export function NotificationEmptyState(props: {
  filter: Filter;
  hadTableError: boolean;
  unreadFilterBlocked?: boolean;
}) {
  const { filter, hadTableError, unreadFilterBlocked } = props;
  if (unreadFilterBlocked) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-extrabold">읽지 않음 필터를 아직 쓸 수 없어요</p>
        <p className="mt-1">앱이 준비되면 읽음 표시에 맞춰 이 탭이 열립니다. 지금은 [전체]에서 확인해 주세요.</p>
      </div>
    );
  }
  if (hadTableError) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-extrabold">알림을 불러오지 못했습니다</p>
        <p className="mt-1">잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 알려 주세요.</p>
      </div>
    );
  }

  if (filter === "unread") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCheck className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="mt-4 text-base font-black text-slate-900">모든 알림을 확인했어요</h3>
        <p className="mt-1.5 max-w-xs text-sm font-medium leading-relaxed text-slate-500">
          읽지 않은 알림이 없습니다. 새 소식이 오면 여기에서 바로 알려드릴게요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF4FF] text-[#2563EB]">
        <Bell className="h-7 w-7" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-black text-slate-900">새 알림이 없어요</h3>
      <p className="mt-1.5 max-w-xs text-sm font-medium leading-relaxed text-slate-500">
        질문 답변·구독·맞춤의뢰·환불 소식이 생기면 한곳에 모아서 알려드려요.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-1.5">
        {TYPE_HINTS.map((t) => (
          <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
