export default function MentorsListLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
