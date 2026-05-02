/**
 * Postgrest / Storage 응답을 사용자에게 보여도 되는 수준의 문구로 정리(기술 원문·테이블명 노출 최소화).
 * 알 수 없는 메시지는 UI에 절대 원문으로 반환하지 않습니다.
 */
const DATA_ERROR_GENERIC =
  "요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.";

/** UI에 노출하지 않을 입력 길이 상한(과도한 페이로드·로그 폭주 방지) */
const MAX_MESSAGE_LENGTH = 500;

function logSanitizedDataError(reason: string, raw: string): void {
  const sample = raw.length > 500 ? `${raw.slice(0, 500)}…` : raw;
  console.error("[mapDataErrorMessage]", reason, sample);
}

function looksTechnicalOrSystem(m: string): boolean {
  if (
    m.includes("pgrst") ||
    m.includes("postgrest") ||
    m.includes("/rest/v1/") ||
    m.includes("violates foreign key") ||
    m.includes("violates unique") ||
    m.includes("violates not-null") ||
    m.includes("violates check") ||
    m.includes("duplicate key") ||
    m.includes("invalid input syntax") ||
    m.includes("syntax error at") ||
    m.includes("permission denied for") ||
    m.includes("42501") ||
    m.includes("42503") ||
    m.includes("42p01") ||
    m.includes("23503") ||
    m.includes("23505") ||
    m.includes("42703") ||
    m.includes("42883") ||
    m.includes("deadlock") ||
    m.includes("connection refused") ||
    m.includes("econnrefused") ||
    m.includes("etimedout") ||
    m.includes("fetch failed") ||
    m.includes("networkerror") ||
    m.includes("typeorm") ||
    m.includes("prisma")
  ) {
    return true;
  }
  return false;
}

export function mapDataErrorMessage(message: string): string {
  const raw = typeof message === "string" ? message : String(message ?? "");
  const t = raw.trim();
  if (!t) {
    return DATA_ERROR_GENERIC;
  }
  if (t.length > MAX_MESSAGE_LENGTH) {
    logSanitizedDataError("input_too_long", t);
    return DATA_ERROR_GENERIC;
  }

  const m = t.toLowerCase();
  if (m.includes("row-level security") || m.includes("rls") || m.includes("policy")) {
    return "데이터 권한이 없습니다. 로그인 상태를 확인해 주세요.";
  }
  if (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    (m.includes("relation") && m.includes("does not exist"))
  ) {
    return "일시적으로 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (m.includes("storage") && m.includes("not found")) {
    return "파일 저장소에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (m.includes("jwt")) {
    return "인증이 만료되었습니다. 다시 로그인해 주세요.";
  }
  if (
    m.includes("permission denied") ||
    m.includes("forbidden resource") ||
    (m.includes("forbidden") && !m.includes("http"))
  ) {
    return "데이터 권한이 없습니다. 로그인 상태를 확인해 주세요.";
  }
  if (m.includes("not authorized") || m.includes("unauthorized")) {
    return "인증이 필요합니다. 다시 로그인해 주세요.";
  }

  if (looksTechnicalOrSystem(m)) {
    logSanitizedDataError("technical_pattern", t);
    return DATA_ERROR_GENERIC;
  }

  logSanitizedDataError("unmapped", t);
  return DATA_ERROR_GENERIC;
}

/** 카테고리 등 조회 실패 시(원문은 표시하지 않음) */
export function mapCategoryLoadError(): string {
  return "카테고리 정보를 불러오지 못했습니다.";
}
