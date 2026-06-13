"use client";

import { useCallback, useState } from "react";
import { getApplicationAttachmentPreviewUrlAction } from "@/lib/customRequest/applicationAttachmentDownloadActions";
import {
  fileExtensionLabel,
  isPreviewableImageMime,
  isPreviewablePdfMime,
} from "@/lib/customRequest/applicationAttachmentMime";

export function CustomRequestApplicationFileChip(props: {
  postId: string;
  applicationId: string;
  attachmentId: string;
  filename: string;
  sizeLabel: string;
  mimeType?: string | null;
  thumbUrl?: string | null;
  className?: string;
  actionClassName?: string;
  /** 리스트 단일 라이트박스 — 제공 시 칩 내부 모달 미사용 */
  onImageClick?: () => void;
}) {
  const [previewBusy, setPreviewBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const isImage = isPreviewableImageMime(props.mimeType, props.filename);
  const isPdf = isPreviewablePdfMime(props.mimeType, props.filename);

  const fetchPreviewUrl = useCallback(async () => {
    const { url } = await getApplicationAttachmentPreviewUrlAction({
      postId: props.postId,
      applicationId: props.applicationId,
      attachmentId: props.attachmentId,
    });
    return url;
  }, [props.applicationId, props.attachmentId, props.postId]);

  const openPdfPreview = useCallback(async () => {
    setInlineError(null);
    setPreviewBusy(true);
    try {
      const url = await fetchPreviewUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setInlineError("미리보기를 열 수 없어요.");
    } finally {
      setPreviewBusy(false);
    }
  }, [fetchPreviewUrl]);

  const thumbInner =
    isImage && props.thumbUrl ? (
      <button
        type="button"
        className="cr-file-thumb-btn"
        onClick={() => {
          if (props.onImageClick) {
            props.onImageClick();
            return;
          }
        }}
        aria-label={`${props.filename} 크게 보기`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={props.thumbUrl} alt="" className="cr-file-thumb-img" />
      </button>
    ) : (
      <span className="cr-file-thumb" aria-hidden>
        {fileExtensionLabel(props.filename, props.mimeType)}
      </span>
    );

  return (
    <li className={`cr-file-chip ${props.className ?? ""}`.trim()}>
      {thumbInner}
      <div className="cr-file-body">
        <p className="name">{props.filename}</p>
        <p className="meta">{props.sizeLabel}</p>
        {inlineError ? <p className="cr-file-inline-error">{inlineError}</p> : null}
      </div>
      {isPdf ? (
        <div className={`cr-file-action ${props.actionClassName ?? ""}`.trim()}>
          <button
            type="button"
            className="btn btn-ghost !min-h-[40px] !px-4 !py-2 !text-[13px]"
            disabled={previewBusy}
            onClick={() => void openPdfPreview()}
          >
            미리보기
          </button>
        </div>
      ) : null}
    </li>
  );
}
