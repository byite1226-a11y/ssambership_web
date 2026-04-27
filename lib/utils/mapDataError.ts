/**
 * Postgrest / Storage 응답을 한국어 힌트로 보강
 */
export function mapDataErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("rls") || m.includes("policy")) {
    return "데이터 권한이 없습니다. 로그인 상태를 확인해 주세요.";
  }
  if (m.includes("storage") && m.includes("not found")) {
    return "저장소(bucket)를 찾을 수 없습니다. 콘솔에서 student-id-images 생성 여부를 확인해 주세요.";
  }
  if (m.includes("jwt")) {
    return "인증이 만료되었습니다. 다시 로그인해 주세요.";
  }
  return message;
}
