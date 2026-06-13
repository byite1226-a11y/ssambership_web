// 클라이언트/서버 공용. node 전용 import 금지 (워크스페이스 클라이언트 컴포넌트에서 사용).

/** 메시지 본문에 직렬화하는 첨부 마커. renderMessageContent 에서 파싱해 썸네일/다운로드로 렌더. */
export function buildAttachmentMessageBody(params: {
  isImage: boolean;
  filename: string;
  url: string;
}): string {
  if (params.isImage) return `[[img]]${params.url}`;
  return `[[file]]${params.filename}|||${params.url}`;
}

export type ParsedAttachment =
  | { kind: "image"; url: string }
  | { kind: "file"; filename: string; url: string };

/** 첨부 마커를 파싱. 마커가 아니면 null. */
export function parseAttachmentMessageBody(body: string): ParsedAttachment | null {
  const trimmed = body.trim();
  if (trimmed.startsWith("[[img]]")) {
    return { kind: "image", url: trimmed.slice("[[img]]".length) };
  }
  if (trimmed.startsWith("[[file]]")) {
    const rest = trimmed.slice("[[file]]".length);
    const sep = rest.indexOf("|||");
    if (sep === -1) return { kind: "file", filename: "첨부 파일", url: rest };
    return { kind: "file", filename: rest.slice(0, sep) || "첨부 파일", url: rest.slice(sep + 3) };
  }
  return null;
}
