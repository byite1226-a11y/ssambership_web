import Link from "next/link";
import {
  groupChannelItemsByBucket,
  type MentorChannelListItem,
} from "@/lib/mentor/mentorChannelQueries";

const BUCKET_LABEL: Record<string, string> = {
  shortform: "숏폼",
  explanation: "해설",
  material: "대표 자료",
  featured_other: "대표 콘텐츠(기타)",
};

function ListBlock(props: { title: string; items: MentorChannelListItem[] }) {
  const { title, items } = props;
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm font-extrabold text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-slate-500">항목 없음 · 타입 컬럼이 없으면 &quot;기타&quot; 구간에만 쌓일 수 있음</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-extrabold text-slate-800">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-bold text-slate-900">{it.title}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{it.publicLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MentorChannelPageBody(props: {
  items: MentorChannelListItem[];
  listError: string | null;
  probe: string;
}) {
  const { items, listError, probe } = props;

  if (listError) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
          <p className="text-sm font-extrabold text-amber-900">채널 자료는 아직 준비 중입니다</p>
          <p className="mt-2 text-sm text-amber-950">
            미디어·연결 테이블이 아직 없거나 접근할 수 없을 때도 여기서 안내합니다. 등록이 가능해지면 목록이 채워져요.
          </p>
          <p className="mt-2 text-xs text-amber-900/80">{probe}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/mentor/profile/edit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500"
          >
            프로필·연결 정보 편집
          </Link>
          <Link href="/mentor/dashboard" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            대시보드로
          </Link>
        </div>
      </div>
    );
  }

  const grouped = groupChannelItemsByBucket(items);

  if (!items.length) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
          <p className="text-sm font-extrabold text-amber-900">등록된 대표 콘텐츠가 없습니다</p>
          <p className="mt-3 text-sm text-amber-950">프로필에서 콘텐츠를 등록하면 이 목록이 채워집니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
            업로드/추가 CTA(예정)
          </span>
          <Link
            href="/mentor/profile/edit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500"
          >
            프로필·연결 정보 편집
          </Link>
        </div>
        <ListBlock title={BUCKET_LABEL.shortform} items={grouped.shortform} />
        <ListBlock title={BUCKET_LABEL.explanation} items={grouped.explanation} />
        <ListBlock title={BUCKET_LABEL.material} items={grouped.material} />
        <ListBlock title={BUCKET_LABEL.featured_other} items={grouped.featured_other} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600">
            미디어 업로드(후속)
          </span>
          <Link
            href="/mentor/profile/edit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
          >
            콘텐츠 연결·프로필
          </Link>
        </div>
      </div>
      <ListBlock title={BUCKET_LABEL.shortform} items={grouped.shortform} />
      <ListBlock title={BUCKET_LABEL.explanation} items={grouped.explanation} />
      <ListBlock title={BUCKET_LABEL.material} items={grouped.material} />
      <ListBlock title={BUCKET_LABEL.featured_other} items={grouped.featured_other} />
    </div>
  );
}
