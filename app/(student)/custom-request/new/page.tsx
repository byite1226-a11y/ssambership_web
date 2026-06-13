import { redirect } from "next/navigation";
import { PageScaffold } from "@/components/shell/PageScaffold";
import { CustomRequestNewForm, type CustomRequestDraftFormInitial } from "@/components/customRequest/CustomRequestNewForm";
import { requireRole } from "@/lib/auth/routeGuard";
import { createClient } from "@/lib/supabase/server";
import { isAuthorOfPost, loadCustomPostById } from "@/lib/customRequest/customRequestQueries";
import { isDraftCustomRequestPost } from "@/lib/customRequest/customRequestPostMappers";
import { mapDataErrorMessage } from "@/lib/utils/mapDataError";
import "@/app/(public)/custom-request/landing.css";

type Row = Record<string, unknown>;

type PageProps = { searchParams?: Promise<{ error?: string; draftId?: string }> };

function stringField(row: Row, keys: readonly string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function dateInputValue(row: Row): string {
  const raw = row.deadline ?? row.due_at ?? row.due_date;
  if (raw == null) return "";
  const text = String(raw).trim();
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
}

function toBudgetValue(value: unknown): string | number | null {
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

function draftInitialFromRow(row: Row): CustomRequestDraftFormInitial {
  return {
    id: String(row.id),
    category: stringField(row, ["category", "category_label", "category_id"]),
    subject: stringField(row, ["subject", "title"]),
    body: stringField(row, ["body", "content", "description"]),
    deadline: dateInputValue(row),
    budgetMin: toBudgetValue(row.budget_min ?? row.budget),
    budgetMax: toBudgetValue(row.budget_max ?? row.budget),
  };
}

export default async function CustomRequestNewPage(props: PageProps) {
  const { user, profile } = await requireRole("student");
  if (profile?.role !== "student") {
    redirect("/custom-request");
  }
  const sp = (await props.searchParams) ?? {};
  const err = typeof sp.error === "string" && sp.error.length ? sp.error : null;
  const errUi = err ? mapDataErrorMessage(err) : null;
  const draftId = typeof sp.draftId === "string" && sp.draftId.trim() ? sp.draftId.trim() : null;
  let draft: CustomRequestDraftFormInitial | null = null;

  if (draftId) {
    const supabase = await createClient();
    const loaded = await loadCustomPostById(supabase, draftId);
    if (!loaded.row || !isAuthorOfPost(user.id, loaded.row).ok || !isDraftCustomRequestPost(loaded.row)) {
      const qs = new URLSearchParams({ draft: "1", error: "임시저장 글을 찾을 수 없거나 이어서 작성할 수 없습니다." });
      redirect(`/custom-request/posts?${qs.toString()}`);
    }
    draft = draftInitialFromRow(loaded.row);
  }

  return (
    <PageScaffold
      compactHero
      hideHero
      eyebrow="맞춤의뢰"
      title="의뢰 등록하기"
      description="요청 내용을 작성하고 필요한 자료를 첨부해 주세요. 멘토 지원을 받은 뒤 주문 확정, 결제 안내, 납품은 단계별로 진행됩니다."
      ctas={[{ href: "/custom-request", label: "맞춤의뢰 소개", tone: "slate" }]}
      sections={[]}
      hideFooterPlaceholderCards
    >
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-0">
        <CustomRequestNewForm errorMessage={errUi} draft={draft} />
      </div>
    </PageScaffold>
  );
}
