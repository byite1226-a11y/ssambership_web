/**
 * Postgrest / Storage 응답을 사용자에게 보여도 되는 수준의 문구로 정리(기술 원문·테이블명 노출 최소화).
 */
export function mapDataErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("rls") || m.includes("policy")) {
    return "데이터 권한이 없습니다. 로그인 상태를 확인해 주세요.";
  }
  if (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    m.includes("relation") && m.includes("does not exist")
  ) {
    return "일시적으로 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (m.includes("storage") && m.includes("not found")) {
    return "파일 저장소에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (m.includes("jwt")) {
    return "인증이 만료되었습니다. 다시 로그인해 주세요.";
  }
  return message;
}

/** 카테고리 등 조회 실패 시(원문은 표시하지 않음) */
export function mapCategoryLoadError(): string {
  return "카테고리 정보를 불러오지 못했습니다.";
}
