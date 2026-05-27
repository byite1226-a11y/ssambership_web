-- =============================================================================
-- 047_active_dispute_settlement_block_trigger.sql
-- Supabase SQL Editor: "VERIFY - Active Dispute Blocking Trigger" 이관본
-- 목적: 진행 중 분쟁(open|under_review|escalated) 시 custom_order_settlement_items INSERT 차단
-- 선행: 004_p0_cash_disputes_admin_draft.sql (disputes), 013_p0_custom_order_settlement_items.sql
-- idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS
-- =============================================================================

create or replace function public.trg_block_settlement_on_active_dispute()
returns trigger
language plpgsql
security invoker
set search_path = public
as $fn$
declare
  v_cnt integer;
begin
  if new.custom_request_order_id is null then
    return new;
  end if;

  select count(*)::integer
    into v_cnt
  from public.disputes d
  where d.custom_request_order_id = new.custom_request_order_id
    and d.status in ('open', 'under_review', 'escalated');

  if v_cnt > 0 then
    raise exception 'settlement insert blocked: active dispute for order %', new.custom_request_order_id
      using errcode = 'P0001',
            hint = '진행 중인 분쟁이 있으면 정산 예정을 추가할 수 없습니다.';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_cosi_prevent_active_dispute on public.custom_order_settlement_items;
create trigger trg_cosi_prevent_active_dispute
  before insert on public.custom_order_settlement_items
  for each row
  execute function public.trg_block_settlement_on_active_dispute();

-- =============================================================================
-- VERIFY - Active Dispute Blocking Trigger
-- =============================================================================

-- 1) trigger 존재
select event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table = 'custom_order_settlement_items'
  and trigger_name = 'trg_cosi_prevent_active_dispute';

-- 2) function 존재
select routine_schema, routine_name, routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'trg_block_settlement_on_active_dispute';
