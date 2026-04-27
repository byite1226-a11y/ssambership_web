export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl p-4 space-y-2">
      <div className="h-7 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
