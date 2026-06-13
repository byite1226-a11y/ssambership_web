-- 062_custom_request_order_unique_active_application.sql
-- Purpose: prevent duplicate custom-request orders and duplicate escrow holds caused by double submit.
--
-- Apply order:
--   1) Run the duplicate-check SELECT below first.
--   2) If it returns any rows, stop and resolve the duplicate orders manually before creating the index.
--   3) If it returns 0 rows, run the CREATE UNIQUE INDEX statement.
--
-- Notes:
--   - This file does not modify escrow RPCs 054~057 and does not relax RLS.
--   - The index is partial: cancelled/canceled/refunded/rejected orders are excluded so a student can reorder
--     after cancellation/refund.
--   - CREATE INDEX CONCURRENTLY must not run inside an explicit transaction block.

-- Duplicate check: should return 0 rows before the index is created.
select
  coalesce(selected_application_id, application_id, custom_request_application_id) as application_key,
  count(*) as active_order_count,
  array_agg(id order by created_at) as order_ids
from public.custom_request_orders
where coalesce(selected_application_id, application_id, custom_request_application_id) is not null
  and lower(coalesce(payment_status, '')) not in ('cancelled', 'canceled', 'refunded')
  and lower(coalesce(status, '')) not in ('cancelled', 'canceled', 'refunded', 'rejected')
  and lower(coalesce(state, '')) not in ('cancelled', 'canceled', 'refunded', 'rejected')
  and lower(coalesce(order_status, '')) not in ('cancelled', 'canceled', 'refunded', 'rejected')
group by 1
having count(*) > 1;

create unique index concurrently if not exists ux_cro_active_application_once
  on public.custom_request_orders ((
    coalesce(selected_application_id, application_id, custom_request_application_id)
  ))
  where coalesce(selected_application_id, application_id, custom_request_application_id) is not null
    and lower(coalesce(payment_status, '')) not in ('cancelled', 'canceled', 'refunded')
    and lower(coalesce(status, '')) not in ('cancelled', 'canceled', 'refunded', 'rejected')
    and lower(coalesce(state, '')) not in ('cancelled', 'canceled', 'refunded', 'rejected')
    and lower(coalesce(order_status, '')) not in ('cancelled', 'canceled', 'refunded', 'rejected');
