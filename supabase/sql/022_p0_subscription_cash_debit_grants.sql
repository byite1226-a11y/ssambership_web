grant execute on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) to service_role;
grant execute on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) to service_role;

comment on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint)
  is 'P0: Debits wallet cash for subscription checkout. Intended to be called only from trusted service-role server code.';

comment on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint)
  is 'P0: Rolls back subscription wallet debit. Intended to be called only from trusted service-role server code.';
