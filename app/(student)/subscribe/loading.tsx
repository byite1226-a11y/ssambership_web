export default function StudentSubscribeLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
