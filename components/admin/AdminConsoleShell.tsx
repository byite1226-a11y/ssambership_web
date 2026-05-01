import type { ReactNode } from "react";
import { AdminConsoleNavSidebar, AdminConsoleNavTop } from "@/components/admin/AdminConsoleNav";

/**
 * 관리자 콘솔 전용 쉘. 일반 AppShell·사용자 상단 메뉴와 분리합니다.
 * `(admin)/admin/(console)/layout.tsx`에서만 사용합니다.
 */
export function AdminConsoleShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row lg:gap-0 lg:px-4 lg:py-6">
        <div className="sticky top-0 z-20 lg:hidden">
          <AdminConsoleNavTop />
        </div>
        <aside className="sticky top-6 z-10 hidden h-[calc(100vh-3rem)] w-60 shrink-0 self-start lg:block">
          <AdminConsoleNavSidebar />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-5 lg:min-h-0 lg:px-2 lg:py-0">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
