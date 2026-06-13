"use client";

import { useCallback, useState } from "react";
import type { ApplicationAttachmentListItem } from "@/lib/customRequest/customRequestQueries";
import { getApplicationAttachmentPreviewUrlAction } from "@/lib/customRequest/applicationAttachmentDownloadActions";
import { isPreviewableImageMime } from "@/lib/customRequest/applicationAttachmentMime";
import { formatAttachmentBytes } from "@/components/customRequest/customRequestDetailLayout";
import { ApplicationAttachmentLightbox } from "@/components/customRequest/ApplicationAttachmentLightbox";
import { CustomRequestApplicationFileChip } from "@/components/customRequest/CustomRequestApplicationFileChip";

type LightboxTarget = {
  attachmentId: string;
  filename: string;
};

export function ApplicationAttachmentFileListClient(props: {
  postId: string;
  applicationId: string;
  attachments: ApplicationAttachmentListItem[];
  thumbUrlByAttachmentId?: Record<string, string>;
  listClassName?: string;
}) {
  const thumbs = props.thumbUrlByAttachmentId ?? {};
  const [lightboxTarget, setLightboxTarget] = useState<LightboxTarget | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const closeLightbox = useCallback(() => {
    setLightboxTarget(null);
    setLightboxUrl(null);
    setLightboxLoading(false);
  }, []);

  const openLightbox = useCallback(
    async (attachment: ApplicationAttachmentListItem) => {
      setListError(null);
      setLightboxTarget({ attachmentId: attachment.id, filename: attachment.original_filename });
      setLightboxUrl(null);
      setLightboxLoading(true);
      try {
        const { url } = await getApplicationAttachmentPreviewUrlAction({
          postId: props.postId,
          applicationId: props.applicationId,
          attachmentId: attachment.id,
        });
        setLightboxUrl(url);
      } catch {
        setListError("미리보기를 열 수 없어요.");
        closeLightbox();
      } finally {
        setLightboxLoading(false);
      }
    },
    [closeLightbox, props.applicationId, props.postId]
  );

  if (props.attachments.length === 0) return null;

  return (
    <>
      {listError ? <p className="cr-file-inline-error mb-2">{listError}</p> : null}
      <ul className={props.listClassName ?? "cr-file-list mt-2"}>
        {props.attachments.map((a) => (
          <CustomRequestApplicationFileChip
            key={a.id}
            postId={props.postId}
            applicationId={props.applicationId}
            attachmentId={a.id}
            filename={a.original_filename}
            sizeLabel={formatAttachmentBytes(a.file_size_bytes)}
            mimeType={a.mime_type}
            thumbUrl={thumbs[a.id] ?? null}
            onImageClick={
              isPreviewableImageMime(a.mime_type, a.original_filename) && thumbs[a.id]
                ? () => void openLightbox(a)
                : undefined
            }
          />
        ))}
      </ul>
      <ApplicationAttachmentLightbox
        open={lightboxTarget != null}
        filename={lightboxTarget?.filename ?? ""}
        imageUrl={lightboxUrl}
        loading={lightboxLoading}
        onClose={closeLightbox}
      />
    </>
  );
}
