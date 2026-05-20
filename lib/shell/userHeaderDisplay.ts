import type { AppRole, UserRow } from "@/lib/types/user";

export type ShellUserHeaderDisplay = {
  primary: string;
  roleBadge: string;
  profileHref: string;
};

const ROLE_BADGE: Record<AppRole, string> = {
  mentor: "멘토",
  student: "학생",
  admin: "관리자",
};

function isRoleLikeName(value: string, role: AppRole): boolean {
  const t = value.trim().toLowerCase();
  if (!t) return true;
  if (t === role) return true;
  if (t === ROLE_BADGE[role]) return true;
  if (t === "mentor" || t === "student" || t === "admin") return true;
  if (t === "멘토" || t === "학생" || t === "관리자") return true;
  return false;
}

/** nickname → display_name → full_name → email 앞부분 → "사용자" */
export function resolveShellUserDisplayName(profile: UserRow | null, role: AppRole): string {
  const candidates = [
    profile?.nickname,
    profile?.display_name,
    profile?.full_name,
    profile?.email?.split("@")[0] ?? null,
  ];
  for (const c of candidates) {
    const t = (c ?? "").trim();
    if (t && !isRoleLikeName(t, role)) return t;
  }
  return "사용자";
}

export function shellUserHeaderDisplay(profile: UserRow | null, role: AppRole): ShellUserHeaderDisplay {
  const roleBadge = ROLE_BADGE[role];
  const base = resolveShellUserDisplayName(profile, role);
  const primary = `${base} 님`;
  const profileHref =
    role === "mentor" ? "/mentor/profile" : role === "student" ? "/mypage" : "/admin";
  return { primary, roleBadge, profileHref };
}
