/**
 * Supabase Auth 오류 문구를 한국어로 바꿔 초보자가 읽기 쉽게 합니다.
 * 매핑되지 않은 메시지는 원문을 그대로 보여 줍니다.
 */
export function mapSupabaseAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (m.includes("user already registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return "비밀번호가 보안 기준을 충족하지 않습니다. 8자 이상으로 설정해 주세요.";
  }
  if (m.includes("email not confirmed") || m.includes("email not verified")) {
    return "이메일 인증을 먼저 완료해 주세요. 메일함(스팸 함 포함)의 링크를 확인해 주세요.";
  }
  if (m.includes("email address is not confirmed")) {
    return "이메일 인증이 아직 완료되지 않았습니다. 메일함(스팸 함 포함)의 링크로 인증해 주세요.";
  }
  if (m.includes("email rate limit") || m.includes("too many requests")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (m.includes("email")) {
    return "이메일 주소를 확인해 주세요.";
  }
  return message;
}
