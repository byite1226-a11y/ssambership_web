drop policy if exists "payments_update_own" on public.payments;

comment on table public.payments
  is 'Payments are not user-updatable. Payment status transitions must be performed by trusted service-role server code.';
