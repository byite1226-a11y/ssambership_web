import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mapPostRowToPublicDetail, isMentorApplicablePostStatus } from "@/lib/customRequest/customRequestPostMappers";
import type { ApplicationAttachmentListItem, PostAttachmentListItem } from "@/lib/customRequest/customRequestQueries";
import { formatDateYMDOrDash } from "@/lib/customRequest/mentorCustomRequestDisplay";
import { formatDeadlineDday } from "@/lib/customRequest/studentPostDisplay";
import {
  CustomRequestBodyText,
  CustomRequestCoreStrip,
  CustomRequestDetailDivider,
  CustomRequestDetailHeader,
  CustomRequestDetailMainCard,
  CustomRequestGuideList,
  CustomRequestSectionPane,
  PostAttachmentFileSection,
} from "@/components/customRequest/customRequestDetailLayout";
import { ApplicationAttachmentFileListClient } from "@/components/customRequest/ApplicationAttachmentFileListClient";

type Row = Record<string, unknown>;

function formatDeadlineValue(deadline: string, row: Row): string {
  if (deadline === "—") return "—";
  const dday = formatDeadlineDday(row);
  if (dday.label === "일정 협의") return deadline;
  return `${deadline} (${dday.label})`;
}

export function MentorCustomRequestDetailCard(props: {
  postId: string;
  row: Row;
  alreadyApplied: boolean;
  submitted?: boolean;
  applicationId?: string | null;
  applicationAttachments?: ApplicationAttachmentListItem[];
  applicationAttachmentThumbUrls?: Record<string, string>;
  attachments?: PostAttachmentListItem[];
  attachmentLoadError?: string | null;
}) {
  const d = mapPostRowToPublicDetail(props.row);
  const open = isMentorApplicablePostStatus(props.row);
  const canApply = !props.alreadyApplied && open;
  const createdLabel = formatDateYMDOrDash(props.row.created_at);
  const postAttachments = props.attachments ?? [];
  const myAttachments = props.applicationAttachments ?? [];

  const coreItems = [
    d.budgetLine !== "—" ? { label: "예산", value: d.budgetLine } : null,
    d.deadline !== "—" ? { label: "마감일", value: formatDeadlineValue(d.deadline, props.row) } : null,
    createdLabel !== "—" ? { label: "등록일", value: createdLabel } : null,
  ].filter((x): x is { label: string; value: string } => x != null);

  return (
    <CustomRequestDetailMainCard className="overflow-hidden !p-0">
      <div className="border-b border-[var(--c-border,#e2e8f2)] px-4 py-3 sm:px-5">
        <nav className="apply-breadcrumb !mb-0" aria-label="경로">
          <span>멘토 / 맞춤의뢰</span>
          <span className="sep" aria-hidden>
            ·
          </span>
          <Link href="/mentor/custom-request/posts">의뢰 목록</Link>
        </nav>
      </div>

      <div className="p-4 sm:p-6">
        {props.submitted ? (
          <p className="cr-section-hint mb-4 font-medium">
            지원서가 제출되었습니다. 의뢰자는 가격·납기·제안 내용을 비교한 뒤 한 분의 제안을 선택할 수 있어요.
          </p>
        ) : null}

        <CustomRequestDetailHeader title={d.title} subject={d.subject} category={d.category} />

        <CustomRequestCoreStrip items={coreItems} />

        <CustomRequestDetailDivider />

        <CustomRequestSectionPane title="요청 내용" hint="희망 범위·세부 사항">
          <CustomRequestBodyText>{d.body}</CustomRequestBodyText>
          {d.deliverableFormat && d.deliverableFormat !== "—" ? (
            <p className="cr-body-meta">
              <strong>결과물 형식</strong> {d.deliverableFormat}
            </p>
          ) : null}
          {d.goal && d.goal !== "—" ? (
            <p className="cr-body-meta">
              <strong>목표</strong> {d.goal}
            </p>
          ) : null}
        </CustomRequestSectionPane>

        <CustomRequestDetailDivider />

        <PostAttachmentFileSection
          postId={props.postId}
          attachments={postAttachments}
          loadError={props.attachmentLoadError ?? null}
          visible
        />

        <CustomRequestDetailDivider />

        <CustomRequestGuideList
          title="이용 안내"
          items={["제안서는 의뢰당 한 번만 제출할 수 있어요.", "의뢰자가 선택하면 주문·작업방으로 이어져요."]}
        />

        {props.alreadyApplied ? (
          <>
            <CustomRequestDetailDivider />
            <section className="cr-submitted-section">
              <h2 className="cr-section-title-v5">
                <span className="bar" aria-hidden />
                이미 제안서를 제출했어요
              </h2>
              <p className="mt-2">같은 의뢰에는 한 번만 제출할 수 있습니다.</p>
              {props.applicationId ? (
                <>
                  <p className="cr-section-hint mt-4 font-bold text-[#0f172a]">첨부한 포트폴리오·참고 파일</p>
                  <ApplicationAttachmentFileListClient
                    postId={props.postId}
                    applicationId={props.applicationId}
                    attachments={myAttachments}
                    thumbUrlByAttachmentId={props.applicationAttachmentThumbUrls}
                    listClassName="cr-file-list mt-3"
                  />
                </>
              ) : null}
              <Link
                href="/mentor/custom-request/posts?tab=applied"
                className="btn btn-success mt-4 inline-flex !min-h-[44px] gap-2 !px-5 !py-2.5 !text-sm"
              >
                제안한 의뢰에서 상태 확인하기
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </section>
          </>
        ) : !canApply ? (
          <>
            <CustomRequestDetailDivider />
            <p className="form-alert-warn">지금은 이 의뢰에 제안할 수 없는 단계예요. 모집이 끝났거나 조건이 맞지 않을 수 있어요.</p>
          </>
        ) : null}

        <div className="cr-detail-footer">
          <Link href="/mentor/custom-request/posts" className="btn btn-ghost">
            목록으로 돌아가기
          </Link>
          {canApply ? (
            <Link href={`/mentor/custom-request/posts/${props.postId}/apply`} className="btn btn-success">
              제안서 작성하기
            </Link>
          ) : null}
        </div>
      </div>
    </CustomRequestDetailMainCard>
  );
}
