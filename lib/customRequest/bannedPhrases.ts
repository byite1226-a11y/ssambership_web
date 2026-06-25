// [정책 변경] 금지어(대필 등) 차단 전면 폐지.
// 과잉 차단(예: "복사", "제출용", "복사뼈")으로 정상 글까지 막히는 문제가 커서,
// 단어 기반 차단 로직을 제거한다. 목록을 비워 어떤 문구도 차단되지 않는다.
// 임포트·타입 호환을 위해 시그니처는 유지한다(호출부의 차단 분기는 더 이상 발동하지 않음).
export const CUSTOM_REQUEST_BANNED_PHRASES = [] as const;

export const CUSTOM_REQUEST_BANNED_WARNING =
  "대필·완성 대행 의뢰는 등록할 수 없습니다";

export function findBannedPhrase(_text: string): string | null {
  return null;
}
