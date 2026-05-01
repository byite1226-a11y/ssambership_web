import type { ReactNode } from "react";

/**
 * 관리자 URL(`/admin/*`) 루트 레이아웃.
 * 인증·쉘은 `admin/(console)/layout.tsx`에서만 수행하고,
 * `/admin/login`은 이 레이아웃만 적용되어 비로그인 접근이 가능합니다.
 */
export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
