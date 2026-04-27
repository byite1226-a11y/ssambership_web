-- P0: 맞춤의뢰 disputes — submitted_by(감사) + active 분쟁 1건만(부분 유니크 인덱스)
-- 선행: 004( disputes 테이블 ) · 008_p0_disputes_insert_party_rls.sql ( RLS )
-- Staging/운영: Supabase SQL Editor에서 순서대로 적용.

-- ---------------------------------------------------------------------------
-- 1) submitted_by — auth.users 참조(레거시 호환: 열이 이미 있으면 ADD 생략)
-- ---------------------------------------------------------------------------
do $migration$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'disputes'
      and column_name = 'submitted_by'
  ) then
    alter table public.disputes
      add column submitted_by uuid null references auth.users (id) on delete set null;
  end if;
end;
$migration$;

comment on column public.disputes.submitted_by is
  '분쟁 접수 시점의 로그인 사용자(auth.users.id). RLS/앱 insert와 별도 감사 추적.';

-- ---------------------------------------------------------------------------
-- 2) 동일 주문에 open / under_review / escalated 인 분쟁 1건만(부분 유니크 인덱스)
--    ( ALTER TABLE ... ADD CONSTRAINT ... WHERE 는 사용하지 않음 )
-- ---------------------------------------------------------------------------
create unique index if not exists disputes_order_active_unique
  on public.disputes (custom_request_order_id)
  where (status in ('open', 'under_review', 'escalated'));

-- NULL custom_request_order_id 행이 여럿이어도(비권장) 인덱스는 서로 충돌하지 않음(PostgreSQL NULL ≠ NULL).

-- =============================================================================
-- Supabase SQL Editor — 검증용(개발/스테이징에서 실행)
-- =============================================================================
-- -- 1) disputes RLS
-- select c.relname, c.relrowsecurity as rls_on
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname = 'disputes';
--
-- -- 2) disputes policy 목록
-- select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'disputes'
-- order by policyname;
--
-- -- 3) active unique 인덱스
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public' and tablename = 'disputes' and indexname = 'disputes_order_active_unique';
--
-- -- 4) 주문 상태 실제 값(terminal 정합성 확인 — orderLifecycleConstants 와 대조)
-- select distinct status, state, order_status
-- from public.custom_request_orders
-- order by 1 nulls first, 2 nulls first, 3 nulls first;
-- =============================================================================
