const CONTACT_PLACEHOLDER = "[연락처 비공개]";

const CONTACT_PATTERNS: RegExp[] = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi,
  /\b(?:open\.kakao\.com|kakaotalk\.com|t\.me|telegram\.me|instagram\.com|instagr\.am|linktr\.ee)\/[^\s<>"']+/gi,
  /(카톡|카카오톡|카카오|kakao|kakaotalk|오픈채팅|open\s*chat)[\s:：=은는-]*[A-Za-z0-9._-]{3,}/gi,
  /(텔레그램|telegram|인스타|instagram|insta|dm)[\s:：=은는-]*@?[A-Za-z0-9._-]{3,}/gi,
];

const PHONE_PATTERN =
  /(^|[^\d])((?:\+?82[-.\s]?)?0(?:10|11|16|17|18|19|2|[3-6][1-5]|50|70|80)[-.\s]?\d{3,4}[-.\s]?\d{4})(?!\d)/g;
const HANDLE_PATTERN = /(^|[\s([{"'`])@[A-Za-z0-9._]{3,30}\b/g;

export function maskContactInText(value: string): string {
  let masked = value;
  masked = masked.replace(PHONE_PATTERN, (_match, prefix: string) => `${prefix}${CONTACT_PLACEHOLDER}`);
  for (const pattern of CONTACT_PATTERNS) {
    masked = masked.replace(pattern, CONTACT_PLACEHOLDER);
  }
  return masked.replace(HANDLE_PATTERN, (_match, prefix: string) => `${prefix}${CONTACT_PLACEHOLDER}`);
}
