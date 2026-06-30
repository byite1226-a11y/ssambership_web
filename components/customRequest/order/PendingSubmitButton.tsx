"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * 폼 제출 중에는 disabled 되는 submit 버튼 (중복 클릭 방지).
 * 서버 액션·게이트는 그대로 두고, 표시 동작(1클릭 후 즉시 비활성)만 추가한다.
 * 부모 <form> 의 자식으로 렌더되어야 useFormStatus 가 동작한다.
 */
export function PendingSubmitButton({
  className,
  children,
  pendingChildren,
}: {
  className: string;
  children: ReactNode;
  pendingChildren?: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending && pendingChildren != null ? pendingChildren : children}
    </button>
  );
}
