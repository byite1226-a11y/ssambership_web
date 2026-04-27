-- =============================================================================
-- P0: 멘토가 맞춤의뢰 공개 상세(/custom-request/[id])를 읽기 위한 최소 열 RPC
--  • custom_request_posts SELECT RLS(crp_select)는 작성자·동의어 컬럼만 허용 →
--    멘토의 직접 SELECT는 0행 → 앱이 notFound()를 호출하는 문제를 해결.
--  • SECURITY DEFINER로 테이블을 읽되, 반환 컬럼만 제한(작성자 uuid·연락처 등 미포함).
--  • 호출: authenticated 만. 멘토(role) + status=open(또는 state 공개 계열) 일 때만 1행 반환.
--    작성자·관리자는 앱에서 기존 loadCustomPostById(직접 SELECT)로 충분.
--  • staging·운영 적용 전 SQL Editor에서 점검.
-- =============================================================================

create or replace function public.get_public_custom_request_post_for_browse(p_post_id uuid)
returns table (
  id uuid,
  title text,
  body text,
  content text,
  subject text,
  description text,
  goal text,
  subcategory text,
  category text,
  due_at timestamptz,
  deadline timestamptz,
  due_date timestamptz,
  deliverable_type text,
  deliverable_format text,
  result_format text,
  output_format text,
  budget_min numeric,
  budget_max numeric,
  state text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    p.id,
    p.title,
    p.body,
    p.content,
    p.subject,
    p.description,
    p.goal,
    p.subcategory,
    p.category,
    p.due_at,
    p.deadline,
    p.due_date,
    p.deliverable_type,
    p.deliverable_format,
    p.result_format,
    p.output_format,
    p.budget_min,
    p.budget_max,
    p.state,
    p.status,
    p.created_at,
    p.updated_at
  from public.custom_request_posts p
  where p.id = p_post_id
    and (select auth.uid()) is not null
    and (
      (select public.is_admin()) = true
      or (
        exists (
          select 1
          from public.users u
          where u.id = (select auth.uid())
            and u.role = 'mentor'
        )
        and (
          lower(trim(coalesce(p.status, ''))) = 'open'
          or lower(trim(coalesce(p.state, ''))) in ('open', 'published')
        )
      )
    )
  limit 1;
$fn$;

revoke all on function public.get_public_custom_request_post_for_browse(uuid) from public;
grant execute on function public.get_public_custom_request_post_for_browse(uuid) to authenticated;

comment on function public.get_public_custom_request_post_for_browse(uuid) is
  'P0 멘토·관리자: 모집 중 맞춤의뢰 상세(최소 열). 작성자 본인은 직접 SELECT(RLS) 사용.';
