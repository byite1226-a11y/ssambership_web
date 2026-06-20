import type { AppRole, UserRow } from "@/lib/types/user";
import { resolveShellUserDisplayName, shellUserHeaderDisplay } from "@/lib/shell/userHeaderDisplay";

const BADGE_CLASS: Record<AppRole, string> = {
  student: "border-blue-100 bg-blue-50 text-blue-600",
  mentor: "border-emerald-100 bg-emerald-50 text-emerald-700",
  admin: "border-violet-200 bg-violet-50 text-violet-800",
};

type Props = {
  profile: UserRow | null;
  role: AppRole;
  nameClassName?: string;
  className?: string;
};

/** 헤더 공통: 사용자명 + 역할 뱃지 (student/admin은 "님" 접미) */
export function UserNameWithRoleBadge({ profile, role, nameClassName, className }: Props) {
  const { roleBadge } = shellUserHeaderDisplay(profile, role);
  const name = resolveShellUserDisplayName(profile, role);
  const label = role === "mentor" ? name : `${name} 님`;

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className ?? ""}`}>
      <span className={`truncate font-bold text-slate-900 ${nameClassName ?? "text-sm"}`}>{label}</span>
      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${BADGE_CLASS[role]}`}>
        {roleBadge}
      </span>
    </span>
  );
}

/** 역할 뱃지만 (관리자 콘솔 등 이름 없이 뱃지만 필요할 때) */
export function RoleBadgeOnly({ role }: { role: AppRole }) {
  const { roleBadge } = shellUserHeaderDisplay(null, role);
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${BADGE_CLASS[role]}`}>
      {roleBadge}
    </span>
  );
}
