import type { ReactNode } from "react";
import Link from "next/link";
import { downloadCustomRequestPostAttachmentAction } from "@/lib/customRequest/postAttachmentDownloadActions";
import { fileExtensionLabel } from "@/lib/customRequest/applicationAttachmentMime";
import type { PostAttachmentListItem } from "@/lib/customRequest/customRequestQueries";

export type CustomRequestCoreStripItem = {
  label: string;
  value: ReactNode;
};

/** 공개/학생·멘토 상세 공통 콘텐츠 폭 (~880px) */
export function CustomRequestDetailShell(props: { children: ReactNode; className?: string }) {
  return <div className={`cr-landing cr-detail-v5 cr-detail-shell ${props.className ?? ""}`.trim()}>{props.children}</div>;
}

/** 비교/선택·지원 대기 — plain breadcrumb (박스형 PageScaffold 헤더 대체) */
export function CustomRequestAppsBreadcrumb(props: { postId: string }) {
  return (
    <nav className="apply-breadcrumb" aria-label="경로">
      <Link href="/custom-request">맞춤의뢰</Link>
      <span className="sep" aria-hidden>
        ·
      </span>
      <Link href={`/custom-request/${props.postId}`}>의뢰 상세</Link>
    </nav>
  );
}

export function CustomRequestDetailHeader(props: { title: string; subject: string; category: string }) {
  const showCategory = props.category && props.category !== "—";
  return (
    <header className="cr-detail-header">
      <span className="eyebrow">맞춤의뢰</span>
      <div className="cr-detail-header-row">
        <h1 className="cr-detail-title">{props.title}</h1>
        {showCategory ? <span className="cr-category-badge">{props.category}</span> : null}
      </div>
      {props.subject && props.subject !== "—" ? <p className="cr-detail-subtitle">{props.subject}</p> : null}
    </header>
  );
}

export function CustomRequestCoreStrip(props: { items: CustomRequestCoreStripItem[] }) {
  if (props.items.length === 0) return null;
  return (
    <div className="cr-core-strip">
      {props.items.map((item) => (
        <div key={item.label} className="cr-core-item">
          <span className="cr-core-label">{item.label}</span>
          <span className="cr-core-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function CustomRequestDetailMainCard(props: { children: ReactNode; className?: string }) {
  return <article className={`cr-detail-card ${props.className ?? ""}`.trim()}>{props.children}</article>;
}

export function CustomRequestStepperShell(props: { children: ReactNode }) {
  return <div className="cr-stepper-shell">{props.children}</div>;
}

export function CustomRequestDetailDivider() {
  return <hr className="cr-detail-divider" />;
}

export function CustomRequestSectionPane(props: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="cr-section-pane">
      <h2 className="cr-section-title-v5">
        <span className="bar" aria-hidden />
        {props.title}
      </h2>
      {props.hint ? <p className="cr-section-hint">{props.hint}</p> : null}
      {props.children}
    </section>
  );
}

export function CustomRequestBodyText(props: { children: ReactNode }) {
  return <div className="cr-body-text">{props.children}</div>;
}

export function CustomRequestGuideList(props: { title: string; items: string[] }) {
  return (
    <section className="cr-section-pane">
      <h2 className="cr-section-title-v5">
        <span className="bar" aria-hidden />
        {props.title}
      </h2>
      <ul className="cr-guide-list">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function formatAttachmentBytes(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "크기 정보 없음";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export { fileExtensionLabel };

export function CustomRequestFileChip(props: {
  filename: string;
  sizeLabel: string;
  mimeType?: string | null;
  downloadAction: ReactNode;
}) {
  return (
    <li className="cr-file-chip">
      <span className="cr-file-thumb" aria-hidden>
        {fileExtensionLabel(props.filename, props.mimeType)}
      </span>
      <div className="cr-file-body">
        <p className="name">{props.filename}</p>
        <p className="meta">{props.sizeLabel}</p>
      </div>
      <div className="cr-file-action">{props.downloadAction}</div>
    </li>
  );
}

export function PostAttachmentFileSection(props: {
  postId: string;
  attachments: PostAttachmentListItem[];
  loadError: string | null;
  visible: boolean;
}) {
  if (!props.visible) return null;

  return (
    <CustomRequestSectionPane title="첨부 파일">
      {props.loadError ? (
        <p className="form-alert-warn mt-2">첨부를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      ) : props.attachments.length === 0 ? (
        <p className="cr-section-hint mt-2">등록된 첨부가 없어요.</p>
      ) : (
        <ul className="cr-file-list">
          {props.attachments.map((a) => (
            <CustomRequestFileChip
              key={a.id}
              filename={a.original_filename}
              sizeLabel={formatAttachmentBytes(a.file_size_bytes)}
              mimeType={a.mime_type}
              downloadAction={
                <form action={downloadCustomRequestPostAttachmentAction}>
                  <input type="hidden" name="postId" value={props.postId} />
                  <input type="hidden" name="attachmentId" value={a.id} />
                  <button type="submit" className="btn btn-ghost !min-h-[40px] !px-4 !py-2 !text-[13px]">
                    다운로드
                  </button>
                </form>
              }
            />
          ))}
        </ul>
      )}
    </CustomRequestSectionPane>
  );
}
