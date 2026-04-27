"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { firstReadableAdminTable } from "@/lib/admin/adminQueries";
import { insertAdminNoticeDraft } from "@/lib/admin/adminNoticesMutations";

const PATH = "/admin/notices";

function errQ(msg: string) {
  const q = new URLSearchParams();
  q.set("error", msg);
  return `${PATH}?${q.toString()}`;
}

export async function submitAdminNoticeDraft(formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const resource = String(formData.get("resource") ?? "notice") as "notice" | "promotion";
  const target = String(formData.get("target") ?? "").trim();
  const start = String(formData.get("start") ?? "").trim();
  const end = String(formData.get("end") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!title) {
    redirect(errQ("제목을 입력하세요."));
  }

  const noticeTables = ["notices", "site_notices", "announcements", "app_notices"] as const;
  const promoTables = ["promotions", "promo_banners", "site_promotions", "promotion_campaigns"] as const;
  const candidates = resource === "promotion" ? promoTables : noticeTables;
  const probe = await firstReadableAdminTable(supabase, candidates);
  if (!probe.table) {
    redirect(errQ(`쓰기 가능한 테이블 없음: ${probe.error}`));
  }

  const r = await insertAdminNoticeDraft(supabase, {
    table: probe.table,
    title,
    body,
    resource: resource === "promotion" ? "promotion" : "notice",
    target,
    start,
    end,
    active,
  });

  if (!r.ok) {
    redirect(errQ(r.error));
  }

  revalidatePath(PATH);
  redirect(`${PATH}?ok=1&new=${r.id}`);
}
