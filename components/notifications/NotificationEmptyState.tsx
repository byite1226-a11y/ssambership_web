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
        <p className="font-extrabold">읽지 않음 탭을 쓰려면 스키마에 read_at / is_read 등이 필요합니다</p>
        <p className="mt-1">지금은 컬럼이 없어 목록을 비웁니다. [전체]로 확인하세요.</p>
      </div>
    );
  }
  if (hadTableError) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-extrabold">알림을 불러오지 못했습니다</p>
        <p className="mt-1">notifications 테이블·RLS·권한을 확인하세요. (이번 턴은 구조/연결만)</p>
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
      <p className="mt-1">Supabase `notifications`에 수신자 기준 row가 있으면 목록이 표시됩니다. 더미 없음.</p>
    </div>
  );
}
