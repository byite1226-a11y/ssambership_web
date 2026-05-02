export function StateBanner({
  kind,
  message,
}: {
  kind: "loading" | "error" | "empty" | "info" | "success";
  message: string;
}) {
  const skin =
    kind === "loading"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : kind === "error"
        ? "border-red-200 bg-red-50 text-red-950"
        : kind === "empty"
          ? "border-slate-200 bg-slate-50 text-slate-800"
          : kind === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-blue-200 bg-blue-50 text-blue-950";
  return <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${skin}`}>{message}</div>;
}
