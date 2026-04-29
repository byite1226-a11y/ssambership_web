revoke all on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) from public;
revoke all on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) from anon;
revoke all on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) from authenticated;

revoke all on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) from public;
revoke all on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) from anon;
revoke all on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) from authenticated;

grant execute on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint) to service_role;
grant execute on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint) to service_role;

comment on function public.record_subscription_cash_debit(uuid, uuid, uuid, bigint)
  is 'P0: Service-role only RPC for subscription cash debit. Public, anon, and authenticated execution are explicitly revoked.';

comment on function public.record_subscription_cash_rollback(uuid, uuid, uuid, bigint)
  is 'P0: Service-role only RPC for subscription cash debit rollback. Public, anon, and authenticated execution are explicitly revoked.';
