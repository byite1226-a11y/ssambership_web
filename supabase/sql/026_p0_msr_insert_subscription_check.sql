drop policy if exists "msr_insert_pair" on public.mentor_student_rooms;
drop policy if exists "msr_insert_with_active_subscription" on public.mentor_student_rooms;

create policy "msr_insert_with_active_subscription" on public.mentor_student_rooms
  for insert to authenticated
  with check (
    (select auth.uid()) = student_id
    and exists (
      select 1
      from public.subscriptions s
      where s.student_id = (select auth.uid())
        and s.mentor_id = mentor_student_rooms.mentor_id
        and s.status = 'active'
    )
  );

comment on table public.mentor_student_rooms
  is 'Question rooms require an active subscription for authenticated inserts. Trusted service-role server code may still bypass RLS for controlled room creation.';
