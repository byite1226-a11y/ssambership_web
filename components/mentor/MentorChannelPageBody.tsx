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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 transition-all">
        <p className="text-sm font-extrabold text-slate-800">{title}</p>
        <p className="mt-2 text-xs text-slate-400">등록된 항목이 없습니다.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <p className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-3">{title}</p>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800">{it.title}</span>
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">{it.publicLabel}</span>
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
  void probe;

  if (listError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6">
          <p className="text-sm font-extrabold text-red-900">채널 자료를 불러오지 못했습니다</p>
          <p className="mt-2 text-sm text-red-950">
            등록된 자료가 없거나 아직 연결되지 않았을 수 있습니다. 준비가 되면 이곳에 표시됩니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/mentor/profile/edit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
          >
            프로필·연결 정보 편집
          </Link>
          <Link href="/mentor/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const grouped = groupChannelItemsByBucket(items);

  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-6">
          <p className="text-sm font-extrabold text-blue-900">등록된 대표 콘텐츠가 없습니다</p>
          <p className="mt-2 text-sm text-blue-950">프로필 편집 화면에서 대표 콘텐츠를 등록하면 이 채널에 목록이 채워집니다.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/mentor/profile/edit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
          >
            대표 콘텐츠 및 프로필 편집
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ListBlock title={BUCKET_LABEL.shortform} items={grouped.shortform} />
          <ListBlock title={BUCKET_LABEL.explanation} items={grouped.explanation} />
          <ListBlock title={BUCKET_LABEL.material} items={grouped.material} />
          <ListBlock title={BUCKET_LABEL.featured_other} items={grouped.featured_other} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/mentor/profile/edit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
          >
            콘텐츠 연결·프로필 수정
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ListBlock title={BUCKET_LABEL.shortform} items={grouped.shortform} />
        <ListBlock title={BUCKET_LABEL.explanation} items={grouped.explanation} />
        <ListBlock title={BUCKET_LABEL.material} items={grouped.material} />
        <ListBlock title={BUCKET_LABEL.featured_other} items={grouped.featured_other} />
      </div>
    </div>
  );
}
