import { Buffer } from "node:buffer";

/**
 * multiline/특수문자 포함 입력을 URL 쿼리에 실을 때 UTF-8 → base64url
 */
export function draftToParam(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64url");
}

/** 쿼리에 없으면 null (복원 안 함) */
export function paramToDraft(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  try {
    return Buffer.from(value, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}
