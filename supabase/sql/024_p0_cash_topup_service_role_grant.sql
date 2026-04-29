revoke all on function public.record_cash_topup(uuid, bigint, text) from public;
revoke all on function public.record_cash_topup(uuid, bigint, text) from anon;
revoke all on function public.record_cash_topup(uuid, bigint, text) from authenticated;

grant execute on function public.record_cash_topup(uuid, bigint, text) to service_role;

comment on function public.record_cash_topup(uuid, bigint, text)
  is 'P0: Service-role only RPC for test cash topup. Public, anon, and authenticated execution are explicitly revoked.';
