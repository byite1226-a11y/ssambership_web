"use client";

import { AdminContentReportsTable } from "@/components/admin/AdminContentReportsTable";
import type { AdminListResult } from "@/lib/admin/adminQueries";

type Props = {
  list: AdminListResult;
  userById: Record<string, { nickname: string | null; full_name: string | null }>;
};

export function AdminModerationWorkspace(props: Props) {
  const userMap = new Map(Object.entries(props.userById));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black text-slate-900">콘텐츠 검수</h1>
        <p className="mt-1 text-sm text-slate-600">신고된 게시글·댓글·숏폼을 검수합니다.</p>
      </header>
      <AdminContentReportsTable list={props.list} userById={userMap} />
    </div>
  );
}
