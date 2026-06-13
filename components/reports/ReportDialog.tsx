import { submitCommunityContentReportAction } from "@/lib/community/communityReportActions";

export type ReportTargetType =
  | "community_post"
  | "shortform"
  | "review"
  | "custom_request"
  | "question_message";

const REASONS = ["부적절한 내용", "스팸·광고", "욕설·비방", "개인정보 노출", "기타"] as const;

type Props = {
  targetType: ReportTargetType;
  /** community_post / shortform 일 때만 사용 */
  postVariant?: "board" | "shortform";
  postId?: string;
  returnPath: string;
};

/**
 * 커뮤니티 게시글·숏폼은 실제 insert 액션과 연결됩니다.
 * 그 외 유형은 백엔드 액션이 없어 폼을 렌더하지 않고 안내만 표시합니다.
 */
export function ReportDialog(props: Props) {
  if (props.targetType === "community_post" || props.targetType === "shortform") {
    const variant = props.targetType === "community_post" ? "board" : "shortform";
    const pid = props.postId?.trim();
    if (!pid) {
      return <p className="text-xs text-amber-800">신고 대상 ID가 없어 제출할 수 없습니다.</p>;
    }
    return (
      <form action={submitCommunityContentReportAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <input type="hidden" name="postVariant" value={variant} />
        <input type="hidden" name="postId" value={pid} />
        <input type="hidden" name="returnPath" value={props.returnPath} />
        <p className="font-extrabold text-slate-900">콘텐츠 신고</p>
        <label className="block text-xs font-bold text-slate-600">
          사유
          <select name="reason" className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" required>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-600">
          상세
          <textarea name="description" maxLength={500} rows={3} className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700">
          신고 제출
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
      <p className="font-extrabold text-slate-900">신고: {props.targetType}</p>
      <p className="mt-2 leading-relaxed">
        이 유형은 아직 사용자 신고 insert 액션이 연결되어 있지 않습니다. 운영자 문의 또는 관리자 화면의 신고 목록을 이용해 주세요.
      </p>
    </div>
  );
}
