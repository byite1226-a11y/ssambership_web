import Link from "next/link";
import { FileText, PlayCircle } from "lucide-react";
import { getStringField } from "@/lib/qna/safeSelect";

type MediaRow = Record<string, unknown>;

function mediaType(row: MediaRow): "pdf" | "video" | "other" {
  const t = (
    getStringField(row, ["type", "media_type", "content_type", "kind"]) ?? ""
  ).toLowerCase();
  if (/video|mp4|youtube|short/.test(t)) return "video";
  if (/pdf|doc|slide|note/.test(t)) return "pdf";
  const url = getStringField(row, ["url", "media_url", "file_url", "link"]) ?? "";
  if (/\.pdf|pdf/i.test(url)) return "pdf";
  if (/youtube|vimeo|\.mp4/i.test(url)) return "video";
  return "other";
}

function mediaTitle(row: MediaRow, fallback: string): string {
  return (
    getStringField(row, ["title", "name", "caption", "label"])?.trim() || fallback
  );
}

function mediaMetric(row: MediaRow, keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  }
  return null;
}

export function MentorContentsList(props: {
  mentorId: string;
  rows: MediaRow[];
  error: string | null;
  loadFailedMessage?: string;
}) {
  const { rows, error, loadFailedMessage } = props;

  if (error) {
    return (
      <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
        {loadFailedMessage ?? "콘텐츠를 불러오지 못했어요."}
      </p>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
        <p className="text-sm font-bold text-slate-800">아직 등록된 콘텐츠가 없어요</p>
        <p className="mt-1 text-xs text-slate-500">멘토가 자료를 올리면 이곳에서 확인할 수 있어요.</p>
      </div>
    );
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
      {rows.slice(0, 12).map((row, i) => {
        const id = row.id != null ? String(row.id) : `media-${i}`;
        const title = mediaTitle(row, `콘텐츠 ${i + 1}`);
        const type = mediaType(row);
        const thumb =
          getStringField(row, ["thumbnail_url", "thumb_url", "cover_url", "image_url"]) ?? null;
        const views = mediaMetric(row, ["view_count", "views", "play_count"]);
        const saves = mediaMetric(row, ["save_count", "saves", "bookmark_count"]);

        return (
          <article
            key={id}
            className="w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  {type === "video" ? (
                    <PlayCircle className="h-10 w-10" strokeWidth={1.5} />
                  ) : (
                    <FileText className="h-10 w-10" strokeWidth={1.5} />
                  )}
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
                {type === "video" ? "영상" : type === "pdf" ? "PDF" : "자료"}
              </span>
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-xs font-black leading-snug text-slate-900">{title}</h3>
              <p className="mt-2 text-[10px] font-semibold text-slate-500">
                조회 {views != null ? views.toLocaleString("ko-KR") : "—"} · 저장{" "}
                {saves != null ? saves.toLocaleString("ko-KR") : "—"}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function MentorContentsSection(props: {
  mentorId: string;
  rows: MediaRow[];
  error: string | null;
  loadFailedMessage?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-black text-slate-900">대표 콘텐츠</h2>
        <Link
          href={`/mentors/${props.mentorId}#contents`}
          className="text-xs font-extrabold text-[#1A56DB] hover:underline"
        >
          전체 보기 &gt;
        </Link>
      </div>
      <div id="contents">
        <MentorContentsList
          mentorId={props.mentorId}
          rows={props.rows}
          error={props.error}
          loadFailedMessage={props.loadFailedMessage}
        />
      </div>
    </section>
  );
}
