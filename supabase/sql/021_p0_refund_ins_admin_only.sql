-- refunds INSERT: admin만 허용 (public.is_admin() = true)
-- 선행: public.refunds, public.is_admin() (001/003/004 등)

drop policy if exists "refund_ins" on public.refunds;

create policy "refund_ins" on public.refunds
  for insert to authenticated
  with check ((select public.is_admin()) = true);
