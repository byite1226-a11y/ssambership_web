import Link from "next/link";
import {
  isAuthorOfPost,
  type CustomListResult,
  type PostAttachmentListItem,
} from "@/lib/customRequest/customRequestQueries";
import {
  isMentorApplicablePostStatus,
  lifecycleStepFromPostRow,
  mapPostRowToPublicDetail,
} from "@/lib/customRequest/customRequestPostMappers";
import { MentorApplicationForm } from "@/components/customRequest/MentorApplicationForm";
import { CustomRequestLifecycleStepper } from "@/components/customRequest/CustomRequestLifecycleStepper";
import {
  CustomRequestBodyText,
  CustomRequestCoreStrip,
  CustomRequestDetailDivider,
  CustomRequestDetailHeader,
  CustomRequestDetailMainCard,
  CustomRequestGuideList,
  CustomRequestSectionPane,
  CustomRequestStepperShell,
  PostAttachmentFileSection,
} from "@/components/customRequest/customRequestDetailLayout";
import type { UserRow } from "@/lib/types/user";

type Row = Record<string, unknown>;

export function CustomRequestPublicPostBody(props: {
  postId: string;
  row: Row;
  postTable: string;
  userId: string | null;
  profile: UserRow | null;
  applications: CustomListResult & { postTable: string | null };
  canViewAttachments: boolean;
  attachments: PostAttachmentListItem[];
  attachmentLoadError: string | null;
}) {
  const { postId, row, postTable: _unusedPostTable, userId, profile, applications, canViewAttachments, attachments, attachmentLoadError } =
    props;
  void _unusedPostTable;
  const d = mapPostRowToPublicDetail(row);
  const author = isAuthorOfPost(userId ?? "", row);
  const isMentor = profile?.role === "mentor";
  const isStudent = profile?.role === "student";
  const isAuthor = userId ? author.ok : false;
  const allowsApply = isMentorApplicablePostStatus(row);
  const appCount = applications.error ? null : applications.rows.length;
  const lifecycleActive = lifecycleStepFromPostRow(row);
  const submittedAppsLabel = applications.error ? "확인 중" : `${applications.rows.length}건`;

  return (
    <div className="w-full">
      <CustomRequestStepperShell>
        <CustomRequestLifecycleStepper active={lifecycleActive} />
      </CustomRequestStepperShell>

      {isStudent && isAuthor && appCount != null && appCount > 0 ? (
        <div className="cr-proposal-banner">
          <p>
            <span className="font-extrabold">{appCount}건</span>의 멘토 제안이 도착했어요.
          </p>
          <Link className="btn btn-primary !min-h-[44px] shrink-0 !px-5 !py-2.5 !text-sm" href={`/custom-request/${postId}/applications`}>
            제안 비교·선택하기
          </Link>
        </div>
      ) : null}

      <CustomRequestDetailMainCard>
        <CustomRequestDetailHeader title={d.title} subject={d.subject} category={d.category} />

        <CustomRequestCoreStrip
          items={[
            { label: "예산", value: d.budgetLine },
            { label: "마감일", value: d.deadline },
            { label: "상태", value: d.status },
            { label: "제출된 지원", value: submittedAppsLabel },
          ]}
        />

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

        {canViewAttachments ? (
          <>
            <CustomRequestDetailDivider />
            <PostAttachmentFileSection
              postId={postId}
              attachments={attachments}
              loadError={attachmentLoadError}
              visible
            />
          </>
        ) : null}

        <CustomRequestDetailDivider />

        <CustomRequestGuideList
          title="이용 안내"
          items={[
            "의뢰 등록은 학생 계정에서 진행돼요.",
            "멘토가 제안을 내면 비교한 뒤 한 분을 골라 주문·진행으로 이어갈 수 있어요.",
          ]}
        />
      </CustomRequestDetailMainCard>

      {isStudent && isAuthor && appCount === 0 ? (
        <div className="cr-proposal-banner mt-4">
          <div>
            <p className="font-extrabold text-[#0f172a]">멘토 지원을 기다리고 있어요</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--c-secondary,#3f4b5f)]">
              제안이 도착하면 비교·선택 화면에서 확인할 수 있어요.
            </p>
          </div>
          <Link className="btn btn-ghost !min-h-[44px] shrink-0 !px-5 !py-2.5 !text-sm" href={`/custom-request/${postId}/applications`}>
            지원 현황 화면 열기
          </Link>
        </div>
      ) : null}

      {isMentor && !isAuthor && allowsApply ? (
        <div className="cr-detail-card mt-4 space-y-3 p-4 sm:p-6">
          <p className="text-sm font-extrabold text-[#0f172a]">이 의뢰에 지원해 보세요</p>
          <MentorApplicationForm postId={postId} returnContext="public" />
        </div>
      ) : null}

      {isMentor && isAuthor ? <p className="form-alert-warn mt-4">멘토 계정으로는 본인이 올린 의뢰에 지원할 수 없어요.</p> : null}

      {!profile ? (
        <p className="mt-4 text-sm font-medium text-[var(--c-secondary,#3f4b5f)]">
          <Link
            className="font-extrabold text-[#2563eb] underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
            href={`/login/mentor?next=${encodeURIComponent(`/custom-request/${postId}`)}`}
          >
            멘토로 로그인
          </Link>
          {` `}
          하시면 지원을 제출할 수 있어요.
        </p>
      ) : null}

      {isMentor && !isAuthor && !allowsApply ? (
        <p className="cr-section-hint mt-4">지금은 새 지원을 받지 않는 단계예요. 모집이 끝났거나 조건이 맞지 않을 수 있어요.</p>
      ) : null}
    </div>
  );
}
