import type { ReactNode } from "react";
import { AdminConsoleNavSidebar, AdminConsoleNavTop } from "@/components/admin/AdminConsoleNav";
import { AdminConsoleTopBar } from "@/components/admin/AdminConsoleTopBar";

/**
 * 관리자 콘솔 전용 쉘 — 일반 AppShell과 분리.
 */
export function AdminConsoleShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full">
        <div className="hidden lg:block">
          <AdminConsoleNavSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminConsoleNavTop />
          <AdminConsoleTopBar />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
