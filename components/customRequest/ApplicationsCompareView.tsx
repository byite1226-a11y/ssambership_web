import type { ApplicationAttachmentListItem, CustomListResult, EnrichedApplication } from "@/lib/customRequest/customRequestQueries";
import {
  pickDisplayField,
  maskContact,
  formatApplicationPriceKrwDisplay,
  formatApplicationDurationDays,
  formatApplicationStatusForStudent,
  getApplicationTextBlocksForCompare,
} from "@/lib/customRequest/customRequestQueries";
import { mapPostRowToPublicDetail } from "@/lib/customRequest/customRequestPostMappers";
import { Avatar } from "@/components/common/Avatar";
import { CustomRequestLifecycleStepper } from "@/components/customRequest/CustomRequestLifecycleStepper";
import { CustomRequestAppsBreadcrumb, CustomRequestStepperShell } from "@/components/customRequest/customRequestDetailLayout";
import { SelectMentorApplicationForm } from "@/components/customRequest/SelectMentorApplicationForm";
import { ApplicationAttachmentsCompareList } from "@/components/customRequest/ApplicationAttachmentsCompareList";
import { maskContactInText } from "@/lib/customRequest/contactMasking";
import Link from "next/link";
import { MentorPostStatusBadge } from "@/components/customRequest/MentorPostStatusBadge";

type Row = Record<string, unknown>;

function maskRowContact(row: Row) {
  const e = pickDisplayField(row, ["mentor_email", "email", "contact_email", "kakao_id", "phone", "tel"]);
  if (e === "—" || e.length < 2) {
    return "—";
  }
  return maskContact(e);
}

function applicationCountForPost(list: CustomListResult): string {
  if (list.error) return "—";
  return String(list.rows.length);
}

function PostRequestSummaryStrip(props: { postId: string; postRow: Row | null; applicationCount: string }) {
  if (!props.postRow) return null;
  const d = mapPostRowToPublicDetail(props.postRow);
  const countLabel = props.applicationCount === "—" ? "확인 중" : `${props.applicationCount}건`;
  return (
    <section className="cr-apps-summary">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="cr-apps-summary-kicker">요청 요약</p>
          <p className="mt-1 break-words text-lg font-black leading-snug text-[#0f172a] sm:text-xl">{d.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {d.category && d.category !== "—" ? (
              <span className="cr-category-badge">{d.category}</span>
            ) : null}
            <MentorPostStatusBadge row={props.postRow} />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--c-secondary,#3f4b5f)]">
          <div>
            <p className="cr-apps-meta-label">예산</p>
            <p className="mt-0.5 font-bold text-[#0f172a]">{d.budgetLine}</p>
          </div>
          <div>
            <p className="cr-apps-meta-label">마감일</p>
            <p className="mt-0.5 font-bold text-[#0f172a]">{d.deadline}</p>
          </div>
          <div>
            <p className="cr-apps-meta-label">지원</p>
            <p className="mt-0.5 font-bold text-[#0f172a]">{countLabel}</p>
          </div>
        </div>
        <Link
          className="btn btn-ghost !min-h-[40px] shrink-0 !px-4 !py-2 !text-sm"
          href={`/custom-request/${props.postId}`}
        >
          요청 상세 보기
        </Link>
      </div>
    </section>
  );
}

const shell = "w-full space-y-4 sm:space-y-5";

export function ApplicationsCompareView(props: {
  list: CustomListResult;
  postId: string;
  postRow: Row | null;
  enriched: EnrichedApplication[];
  existingOrderId: string | null;
  attachmentsByApplicationId?: Record<string, ApplicationAttachmentListItem[]>;
  attachmentThumbUrlByAttachmentId?: Record<string, string>;
}) {
  const { list, postId, postRow, enriched, existingOrderId, attachmentsByApplicationId = {}, attachmentThumbUrlByAttachmentId = {} } = props;
  const nApps = list.error ? 0 : list.rows.length;
  const appCountLabel = applicationCountForPost(list);

  if (list.error && !list.rows.length) {
    return (
      <div className={shell}>
        <CustomRequestAppsBreadcrumb postId={postId} />
        <PostRequestSummaryStrip postId={postId} postRow={postRow} applicationCount="—" />
        <CustomRequestStepperShell>
          <CustomRequestLifecycleStepper active="compare" />
        </CustomRequestStepperShell>
        <div className="cr-apps-card text-sm text-[var(--c-secondary,#3f4b5f)]">
          <p className="font-extrabold text-[#0f172a]">지원서를 불러오지 못했어요</p>
          <p className="mt-1.5">잠시 후 다시 시도해 주세요.</p>
        </div>
      </div>
    );
  }
  if (!list.rows.length) {
    return (
      <div className={shell}>
        <CustomRequestAppsBreadcrumb postId={postId} />
        <PostRequestSummaryStrip postId={postId} postRow={postRow} applicationCount="0" />
        <div className="cr-apps-page-head">
          <h2>멘토 지원 대기</h2>
          <p>제안이 들어오면 여기서 비교·선택할 수 있어요.</p>
        </div>
        <CustomRequestStepperShell>
          <CustomRequestLifecycleStepper active="compare" />
        </CustomRequestStepperShell>
        <div className="grid gap-3 sm:grid-cols-1">
          <div className="cr-apps-card">
            <p className="text-sm font-extrabold text-[#0f172a]">지원 현황</p>
            <p className="mt-1 text-2xl font-black text-[#2563EB]">0건</p>
            <p className="mt-1 text-sm font-medium text-[var(--c-secondary,#3f4b5f)]">멘토가 제안을 내면 카드로 쌓여요.</p>
          </div>
          <div className="cr-apps-card">
            <p className="text-sm font-extrabold text-[#0f172a]">마감·일정</p>
            <p className="mt-1 break-words text-sm font-medium text-[var(--c-secondary,#3f4b5f)]">
              {postRow ? `마감일: ${mapPostRowToPublicDetail(postRow).deadline}` : "요청 정보를 불러오는 중이에요."}
            </p>
            <p className="mt-2 text-xs font-medium text-[var(--c-tertiary,#8a96a8)]">일정 조정은 이후 단계에서 멘토와 맞출 수 있어요.</p>
          </div>
        </div>
        <div className="cr-apps-notice !text-left">
          <p className="text-sm font-extrabold text-[#0f172a]">알림</p>
          <p className="mt-1.5 break-words text-sm font-medium text-[var(--c-secondary,#3f4b5f)]">
            새 제안이 오면 이 페이지를 다시 열어 확인해 주세요.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap">
          <Link
            className="btn btn-ghost !min-h-[44px] min-w-0 !px-4 !text-sm"
            href={`/custom-request/${postId}`}
          >
            요청 내용으로 돌아가기
          </Link>
        </div>
        <p className="text-center text-sm break-words font-medium text-[var(--c-tertiary,#8a96a8)]">내용을 고치려면 고객 안내를 참고해 주세요.</p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <CustomRequestAppsBreadcrumb postId={postId} />
      <PostRequestSummaryStrip postId={postId} postRow={postRow} applicationCount={nApps > 0 ? String(nApps) : appCountLabel} />
      <div className="cr-apps-page-head">
        <h2>멘토 지원서 목록</h2>
        <p>제안 가격·기간·내용을 비교하고 선택해 주세요.</p>
      </div>
      <CustomRequestStepperShell>
        <CustomRequestLifecycleStepper active="compare" />
      </CustomRequestStepperShell>
      {existingOrderId ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950 sm:p-5">
          <p className="font-extrabold">이미 이 의뢰에 대한 주문이 있어요.</p>
          <Link
            className="mt-3 inline-flex min-h-[44px] min-w-0 items-center break-words font-extrabold text-emerald-800 underline underline-offset-2"
            href={`/custom-request/orders/${existingOrderId}`}
          >
            주문 화면으로 이동
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {enriched.map((e, i) => {
          const r = e.row;
          const displayName = e.display?.displayName ?? pickDisplayField(r, ["mentor_name", "mentor_display_name", "mentor_nickname"]);
          const schoolLine = e.display
            ? [e.display.university, e.display.department].filter((x) => x && x !== "—").join(" · ")
            : "";
          const { proposal } = getApplicationTextBlocksForCompare(r);
          const maskedProposal = maskContactInText(proposal);
          const preview =
            maskedProposal && maskedProposal !== "작성된 내용이 없습니다."
              ? maskedProposal.replace(/\s+/g, " ").trim()
              : "";
          const canPreviewAttachments = Boolean(existingOrderId);
          const avatarUrl = e.display?.photoUrl && e.display.photoUrl !== "—" ? e.display.photoUrl : null;
          const verified = ["approved", "verified", "complete", "인증 완료"].some((v) =>
            String(e.display?.verification ?? "").toLowerCase().includes(v)
          );
          // 공개 멘토 프로필 링크 — mentorId가 있을 때만(없으면 평문 폴백). 비교 흐름 유지 위해 새 탭.
          const profileHref = e.mentorId ? `/mentors/${encodeURIComponent(e.mentorId)}` : null;
          const mentorProfileLabel = displayName !== "—" ? displayName : "멘토";
          const avatarEl = (
            <Avatar
              name={displayName !== "—" ? displayName : null}
              photo={avatarUrl}
              role="mentor"
              className="h-14 w-14 text-lg"
              ring
            />
          );

          return (
            <li
              key={String(pickDisplayField(r, ["id", "key"]) + String(i))}
              className="cr-apps-card"
            >
              <div className="flex flex-wrap items-start gap-4">
                {profileHref ? (
                  <Link
                    href={profileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`멘토 ${mentorProfileLabel} 프로필 보기`}
                    className="shrink-0 rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  >
                    {avatarEl}
                  </Link>
                ) : (
                  avatarEl
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`멘토 ${mentorProfileLabel} 프로필 보기`}
                        className="text-base font-extrabold text-slate-900 underline-offset-2 transition hover:text-blue-700 hover:underline focus-visible:text-blue-700 focus-visible:underline focus-visible:outline-none"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <p className="text-base font-extrabold text-slate-900">{displayName}</p>
                    )}
                    {verified ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                        인증
                      </span>
                    ) : null}
                    <span className="text-xs font-medium text-slate-400">{formatApplicationStatusForStudent(r)}</span>
                  </div>
                  {schoolLine ? <p className="mt-0.5 text-sm font-medium text-slate-600">{schoolLine}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span className="font-extrabold text-[#2563EB]">{formatApplicationPriceKrwDisplay(r)}</span>
                    <span className="font-bold text-slate-700">예상 {formatApplicationDurationDays(r)}</span>
                  </div>
                  {preview ? (
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">{preview}</p>
                  ) : null}
                  {e.applicationId ? (
                    <ApplicationAttachmentsCompareList
                      postId={postId}
                      applicationId={e.applicationId}
                      attachments={attachmentsByApplicationId[e.applicationId] ?? []}
                      thumbUrlByAttachmentId={attachmentThumbUrlByAttachmentId}
                      allowPreview={canPreviewAttachments}
                      maskFilenames={!canPreviewAttachments}
                    />
                  ) : null}
                  <p className="mt-1 text-[11px] text-slate-400">연락처: {maskRowContact(r)} (선정 전 비공개)</p>
                </div>
                <div className="w-full shrink-0 sm:w-auto sm:pt-1">
                  {!existingOrderId && e.applicationId ? (
                    <SelectMentorApplicationForm
                      postId={postId}
                      applicationId={e.applicationId}
                      mentorName={displayName !== "—" ? displayName : undefined}
                    />
                  ) : !existingOrderId && !e.applicationId ? (
                    <SelectMentorApplicationForm postId={postId} applicationId="" disabled />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!existingOrderId ? (
        <p className="cr-apps-notice">한 분을 고르면 주문 화면으로 이어져요.</p>
      ) : null}
    </div>
  );
}
