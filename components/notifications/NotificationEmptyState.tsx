type Filter = "all" | "unread";

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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-extrabold">읽지 않은 알림이 없습니다</p>
        <p className="mt-1">새 답변·결제·의뢰가 오면 여기에 쌓입니다(발송·푸시는 후속).</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-extrabold">알림이 아직 없습니다</p>
      <p className="mt-1">새 소식이 생기면 이 목록에 표시됩니다.</p>
    </div>
  );
}
