/**
 * 관리자 콘솔에 DB·PostgREST·내부 스택 원문이 노출되지 않도록 표시용 문구만 변환합니다.
 * (조회 로직·에러 객체 자체는 변경하지 않고, UI에 넘기기 직전/렌더 시에만 사용)
 */

export type AdminErrorDisplayContext = "default" | "notices" | "reports" | "settlements" | "mentorApprovals";

const FORBIDDEN_SUBSTRINGS = [
  "supabase",
  "postgrest",
  "pgrst",
  "schema cache",
  "public.",
  "rls",
  "jwt",
  "permission denied",
  "relation does not exist",
  "could not find the table",
  "app_notices",
  "promotion_campaigns",
  "content_reports",
  "payout_items",
  "mentor_profiles",
  "sourcenote",
  "probe",
] as const;

const DATASTORE_MESSAGE = /could not find|schema cache|relation does not exist|permission denied|does not exist|in the schema|invalid.*uuid|42703|42p01|42p02/i;

export const ADMIN_LIST_ERROR_TITLE = "목록을 불러오지 못했습니다.";

const GENERIC_RETRY = "정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";

/** 목록 조회 실패 시 본문(페이지·컨텍스트별) */
export function adminListErrorDescription(context: AdminErrorDisplayContext): string {
  switch (context) {
    case "notices":
      return "등록된 공지 또는 프로모션을 불러올 수 없습니다. 아직 연결된 운영 데이터가 없거나 목록 연결을 준비 중입니다.";
    case "reports":
      return "신고 목록을 불러올 수 없습니다. 아직 연결된 운영 데이터가 없거나 목록 연결을 준비 중입니다.";
    case "settlements":
      return "정산 목록을 불러올 수 없습니다. 아직 연결된 운영 데이터가 없거나 목록 연결을 준비 중입니다.";
    case "mentorApprovals":
      return "멘토 승인 목록을 불러올 수 없습니다. 아직 연결된 운영 데이터가 없거나 목록 연결을 준비 중입니다.";
    default:
      return "아직 연결된 운영 데이터가 없거나 목록 연결을 준비 중입니다.";
  }
}

export function adminListFetchFailedCopy(context: AdminErrorDisplayContext): { title: string; description: string } {
  return { title: ADMIN_LIST_ERROR_TITLE, description: adminListErrorDescription(context) };
}

/** 공지 vs 프로모션 블록별 안내(한 블록만 실패한 경우) */
export function adminNoticesSectionDescription(kind: "notice" | "promotion"): string {
  if (kind === "promotion") {
    return "등록된 프로모션을 불러올 수 없습니다. 아직 연결된 운영 데이터가 없거나 목록 연결을 준비 중입니다.";
  }
  return "등록된 공지를 불러올 수 없습니다. 아직 연결된 운영 데이터가 없거나 목록 연결을 준비 중입니다.";
}

function containsForbidden(msg: string): boolean {
  const lower = msg.toLowerCase();
  for (const f of FORBIDDEN_SUBSTRINGS) {
    if (lower.includes(f)) return true;
  }
  return false;
}

function requiresRedaction(msg: string): boolean {
  if (containsForbidden(msg)) return true;
  if (DATASTORE_MESSAGE.test(msg)) return true;
  return false;
}

/** 짧은 한글 안내 등은 그대로 두고, 기술적·내부 메시지는 숨김 */
function isSafePassthrough(msg: string): boolean {
  if (requiresRedaction(msg)) return false;
  if (/[a-z]{5,}/i.test(msg) && /['`_[\]]/.test(msg)) return false;
  return true;
}

/**
 * URL 쿼리·폼 등에 들어온 메시지를 관리자 화면용으로 변환합니다.
 * 내부/데이터소스 성격이면 컨텍스트별 목록 문구 또는 일반 안내로 대체합니다.
 */
export function toAdminDisplayError(
  message: string | null | undefined,
  context: AdminErrorDisplayContext = "default"
): string | null {
  if (message == null || String(message).trim() === "") return null;
  const raw = String(message).trim();
  if (requiresRedaction(raw)) {
    return context === "default" ? GENERIC_RETRY : adminListErrorDescription(context);
  }
  if (!isSafePassthrough(raw)) {
    return context === "default" ? GENERIC_RETRY : adminListErrorDescription(context);
  }
  return raw;
}
