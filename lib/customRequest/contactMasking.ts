const CONTACT_PLACEHOLDER = "[연락처 비공개]";

// [정책: 보수적 마스킹]
// "누가 봐도 연락처/외부 메신저"인 것만 가린다. 과잉필터(정상 글이 가려지는 것)를
// 줄이기 위해 다음은 의도적으로 가리지 않는다(우회 일부 감수):
//   - 영어 단어 내부 부분매칭(instagram/kakaopay/dmesg 등)
//   - 키워드 없는 단독 @핸들(@property 같은 코드 표기 보호)
//   - 일반 URL(학습 자료 링크 보호) — 단, 알려진 메신저 도메인은 가린다

// 1) 이메일 — 도메인+TLD가 있는 명백한 형태만
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

// 2) 외부 메신저/연락 플랫폼 링크 — 명확한 도메인만(경로는 선택)
const CONTACT_LINK_PATTERN =
  /\b(?:open\.kakao\.com|kakaotalk\.com|t\.me|telegram\.me|instagram\.com|instagr\.am|linktr\.ee)(?:\/[^\s<>"']*)?/gi;

// 3) 한국어 메신저 키워드 + 아이디(라틴/숫자 4자 이상).
//    뒤에 한글이 오면(예: "인스타 알고리즘") 매칭되지 않아 일반 대화를 보호한다.
//    긴 키워드를 먼저 두어 부분매칭을 방지(카카오톡 > 카톡, 인스타그램 > 인스타).
const MESSENGER_HANDLE_PATTERN =
  /(카카오톡|카톡|오픈채팅|텔레그램|인스타그램|인스타|디엠)\s*[:：=]?\s*@?[A-Za-z0-9._-]{4,}/g;

// 4) 전화번호 — 국내(010 등) + 국제(+82). 단순 숫자(학번·문항번호 등)는 가리지 않는다.
const PHONE_PATTERN =
  /(^|[^\d])(\+82[-.\s]?0?1[0-9][-.\s]?\d{3,4}[-.\s]?\d{4}|0(?:10|11|16|17|18|19|2|[3-6][1-5]|50|70|80)[-.\s]?\d{3,4}[-.\s]?\d{4})(?!\d)/g;

export function maskContactInText(value: string): string {
  let masked = value;
  masked = masked.replace(PHONE_PATTERN, (_match, prefix: string) => `${prefix}${CONTACT_PLACEHOLDER}`);
  masked = masked.replace(EMAIL_PATTERN, CONTACT_PLACEHOLDER);
  masked = masked.replace(CONTACT_LINK_PATTERN, CONTACT_PLACEHOLDER);
  masked = masked.replace(MESSENGER_HANDLE_PATTERN, CONTACT_PLACEHOLDER);
  return masked;
}
