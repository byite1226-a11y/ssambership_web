-- P0: 맞춤의뢰 주문 — 멘토 정산 예정(1차) + 금액·상태 메타
-- 선행: 001(users), 003(custom_request_posts, custom_request_orders) · is_admin()
-- idempotent, 010/012와 충돌 없음
--
-- 보강(학생 insert 제거·CHECK·서비스 롤 insert): 014_p0_harden_custom_order_settlement_items.sql

-- ---------------------------------------------------------------------------
-- 1) custom_order_settlement_items
-- ---------------------------------------------------------------------------
create table if not exists public.custom_order_settlement_items (
  id uuid primary key default gen_random_uuid(),
  custom_request_order_id uuid not null references public.custom_request_orders (id) on delete cascade,
  mentor_id uuid not null references public.users (id) on delete restrict,
  student_id uuid references public.users (id) on delete set null,
  gross_amount integer not null,
  platform_fee_amount integer not null,
  mentor_amount integer not null,
  fee_rate numeric not null default 0.20,
  status text not null default 'pending' check (status in ('pending', 'on_hold', 'payable', 'paid', 'cancelled')),
  reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.custom_order_settlement_items is
  '맞춤의뢰 주문 납품 수락 후 정산·지급 후보(실제 PG/지급은 별도).';

create unique index if not exists uq_cosi_one_per_order
  on public.custom_order_settlement_items (custom_request_order_id);

create index if not exists idx_cosi_mentor_created
  on public.custom_order_settlement_items (mentor_id, created_at desc);

create index if not exists idx_cosi_student
  on public.custom_order_settlement_items (student_id, created_at desc);

drop trigger if exists trg_cosi_set_updated on public.custom_order_settlement_items;
create trigger trg_cosi_set_updated
  before update on public.custom_order_settlement_items
  for each row execute function public.set_updated_at();

alter table public.custom_order_settlement_items enable row level security;

-- 당사자(학생·멘토) + admin — insert는 학생(의뢰자) 본인만(수락 액션)
drop policy if exists "cosi_select_parties" on public.custom_order_settlement_items;
create policy "cosi_select_parties"
  on public.custom_order_settlement_items
  for select
  to authenticated
  using (
    (select public.is_admin()) = true
    or mentor_id = (select auth.uid())
    or student_id = (select auth.uid())
  );

drop policy if exists "cosi_insert_by_student" on public.custom_order_settlement_items;
create policy "cosi_insert_by_student"
  on public.custom_order_settlement_items
  for insert
  to authenticated
  with check ( student_id = (select auth.uid()) );

-- 정산 row 갱신은 운영·배치(서비스) 전제 — 클라이언트 직접 update 방지(관리자만)
drop policy if exists "cosi_update_admin" on public.custom_order_settlement_items;
create policy "cosi_update_admin"
  on public.custom_order_settlement_items
  for update
  to authenticated
  using ( (select public.is_admin()) = true )
  with check ( (select public.is_admin()) = true );

-- =============================================================================
-- Supabase — 검증용
-- -- 테이블
-- select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'custom_order_settlement_items' order by ordinal_position;
-- -- 특정 주문
-- select * from public.custom_order_settlement_items where custom_request_order_id = '<uuid>';
-- -- 멘토 목록
-- select * from public.custom_order_settlement_items where mentor_id = auth.uid() order by created_at desc;
-- =============================================================================
