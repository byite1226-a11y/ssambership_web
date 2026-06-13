import type { ApplicationAttachmentListItem } from "@/lib/customRequest/customRequestQueries";
import { ApplicationAttachmentFileListClient } from "@/components/customRequest/ApplicationAttachmentFileListClient";

export function ApplicationAttachmentsCompareList(props: {
  postId: string;
  applicationId: string;
  attachments: ApplicationAttachmentListItem[];
  title?: string;
  className?: string;
  variant?: "default" | "detail";
  thumbUrlByAttachmentId?: Record<string, string>;
}) {
  if (props.attachments.length === 0) return null;
  const title = props.title ?? "포트폴리오·참고 파일";

  const list = (
    <ApplicationAttachmentFileListClient
      postId={props.postId}
      applicationId={props.applicationId}
      attachments={props.attachments}
      thumbUrlByAttachmentId={props.thumbUrlByAttachmentId}
      listClassName={props.variant === "detail" ? "cr-file-list" : "cr-file-list mt-2"}
    />
  );

  if (props.variant === "detail") {
    return (
      <div className="mt-4">
        <p className="cr-section-hint font-bold text-[#0f172a]">{title}</p>
        {list}
      </div>
    );
  }

  return (
    <div
      className={
        props.className ??
        "mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 sm:p-4"
      }
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{title}</p>
      {list}
    </div>
  );
}
