-- P0 보강: custom_order_settlement_items — RLS(학생 직접 insert 제거) + 금액·요율 CHECK
-- 선행: 013_p0_custom_order_settlement_items.sql — 스테이징에 013만 있으면 014만 추가 적용하면 됨
-- idempotent

-- ---------------------------------------------------------------------------
-- 1) RLS: authenticated 학생 insert 제거 (정산 insert는 service role·서버 전용)
-- ---------------------------------------------------------------------------
drop policy if exists "cosi_insert_by_student" on public.custom_order_settlement_items;

-- ---------------------------------------------------------------------------
-- 2) CHECK 제약(기존에 없을 때만). 위반 행이 있으면 ADD CONSTRAINT는 실패할 수 있음 — 데이터 정리 후 재실행.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cosi_chk_amounts_core'
  ) then
    alter table public.custom_order_settlement_items
      add constraint cosi_chk_amounts_core check (
        gross_amount > 0
        and mentor_amount > 0
        and platform_fee_amount >= 0
        and (platform_fee_amount + mentor_amount) = gross_amount
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cosi_chk_fee_rate_bounds'
  ) then
    alter table public.custom_order_settlement_items
      add constraint cosi_chk_fee_rate_bounds check (fee_rate >= 0 and fee_rate <= 1);
  end if;
end $$;

-- status CHECK는 013 create table 시 이미 포함됨 (pending, on_hold, payable, paid, cancelled)

-- custom_request_order_id 유일: 013 uq_cosi_one_per_order 인덱스로 이미 강제됨.
-- (테이블이 비어 unique constraint만 필요하면) 이름 있는 UNIQUE는 인덱스로 충분.

-- =============================================================================
-- 검증(수동)
-- \d+ public.custom_order_settlement_items
-- select conname from pg_constraint where conrelid = 'public.custom_order_settlement_items'::regclass;
-- select * from pg_policies where tablename = 'custom_order_settlement_items';
-- =============================================================================
