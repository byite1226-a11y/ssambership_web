type Row = Record<string, unknown>;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function DisputeKeyValueList(props: { title: string; row: Row | null; maxKeys?: number }) {
  const { title, row, maxKeys = 12 } = props;
  if (!row) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
        <h3 className="font-extrabold text-slate-900">{title}</h3>
        <p className="mt-1">데이터 없음</p>
      </section>
    );
  }
  const keys = Object.keys(row).slice(0, maxKeys);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <h3 className="font-extrabold text-slate-900">{title}</h3>
      <ul className="mt-2 space-y-1 text-slate-800">
        {keys.map((k) => (
          <li key={k}>
            <span className="text-slate-500">{k}</span> {cell(row[k])}
          </li>
        ))}
      </ul>
    </section>
  );
}
