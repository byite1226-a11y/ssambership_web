import Link from "next/link";
import type { MentorApplicationWithPostHint } from "@/lib/customRequest/customRequestQueries";
import { pickDisplayField } from "@/lib/customRequest/customRequestQueries";

export function MentorAppliedListSection(props: { items: MentorApplicationWithPostHint[]; listFailed: boolean }) {
  if (props.listFailed) {
    return <p className="text-sm text-slate-600">지원 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
  }
  if (!props.items.length) {
    return <p className="text-sm text-slate-600">아직 제출하신 지원이 없습니다.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-slate-800">
      {props.items.map((it) => {
        const a = it.application;
        const st = pickDisplayField(a, ["status", "state"]);
        return (
          <li key={String(a.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Link className="font-bold text-blue-800 hover:underline" href={it.href}>
              {it.postTitle}
            </Link>
            <p className="text-xs text-slate-500">지원 상태 {st}</p>
          </li>
        );
      })}
    </ul>
  );
}
